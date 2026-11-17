"""
routers/short_leaves.py - Short Leave Requests API (a few hours off, same day).

GET    /api/short-leaves                 list (?status= &employee_id= &date=)
GET    /api/short-leaves/{id}            view one
POST   /api/short-leaves                 submit (status starts as "Pending")
PATCH  /api/short-leaves/{id}/approve    HR approves
PATCH  /api/short-leaves/{id}/reject     HR rejects (remarks required)
DELETE /api/short-leaves/{id}            cancel (only while Pending)
"""
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from helpers import (delete_pending_request, employee_names, get_active_employee,
                     get_or_404, review_request, today)
from schemas import ReviewIn, ShortLeaveIn
from storage import next_id, read_data, write_data

router = APIRouter(prefix="/api/short-leaves", tags=["Short Leave Requests"])

FILE = "short_leave_requests"
LABEL = "Short leave"


def _with_name(request: dict, names: dict) -> dict:
    return {**request, "employee_name": names.get(request["employee_id"], "Unknown")}


@router.get("")
def list_short_leaves(
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None,
    employee_id: Optional[str] = None,
    date: Optional[str] = None,
):
    requests = read_data(FILE)
    if status:
        requests = [r for r in requests if r["status"] == status]
    if employee_id:
        requests = [r for r in requests if r["employee_id"] == employee_id]
    if date:
        requests = [r for r in requests if r["date"] == date]

    names = employee_names()
    requests = sorted(requests, key=lambda r: (r["date"], r["from_time"]), reverse=True)
    return [_with_name(r, names) for r in requests]


@router.get("/{request_id}")
def get_short_leave(request_id: str):
    return _with_name(get_or_404(read_data(FILE), request_id, LABEL), employee_names())


@router.post("", status_code=201)
def submit_short_leave(data: ShortLeaveIn):
    get_active_employee(data.employee_id)

    requests = read_data(FILE)
    day = data.date.isoformat()
    start, end = data.from_time.strftime("%H:%M"), data.to_time.strftime("%H:%M")

    # Rule: no overlapping short leave for the same employee on the same day
    for r in requests:
        if (r["employee_id"] == data.employee_id and r["date"] == day
                and r["status"] in ("Pending", "Approved")
                and start < r["to_time"] and end > r["from_time"]):
            raise HTTPException(
                400, f"Overlaps with {r['id']} ({r['from_time']} - {r['to_time']}) on {day}")

    new_request = {
        "id": next_id(requests, "SL"),
        "employee_id": data.employee_id,
        "date": day,
        "from_time": start,
        "to_time": end,
        "hours": data.hours(),
        "reason": data.reason,
        "status": "Pending",
        "applied_on": today(),
        "reviewed_on": None,
        "hr_remarks": "",
    }
    requests.append(new_request)
    write_data(FILE, requests)
    return new_request


@router.patch("/{request_id}/approve")
def approve_short_leave(request_id: str, review: ReviewIn = ReviewIn()):
    return review_request(FILE, request_id, "Approved", review.hr_remarks, LABEL)


@router.patch("/{request_id}/reject")
def reject_short_leave(request_id: str, review: ReviewIn):
    return review_request(FILE, request_id, "Rejected", review.hr_remarks, LABEL)


@router.delete("/{request_id}")
def cancel_short_leave(request_id: str):
    return delete_pending_request(FILE, request_id, LABEL)
