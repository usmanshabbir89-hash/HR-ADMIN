"""
routers/leave_requests.py - Leave Requests API.

GET    /api/leave-requests                        list (?status= &employee_id= &leave_type_id=)
GET    /api/leave-requests/balance/{employee_id}  leave balance per leave type (?year=)
GET    /api/leave-requests/{id}                   view one
POST   /api/leave-requests                        submit (status starts as "Pending")
PATCH  /api/leave-requests/{id}/approve           HR approves
PATCH  /api/leave-requests/{id}/reject            HR rejects (remarks required)
DELETE /api/leave-requests/{id}                   cancel (only while Pending)
"""
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from helpers import (delete_pending_request, employee_names, get_active_employee,
                     get_or_404, review_request, today)
from schemas import LeaveRequestIn, ReviewIn
from storage import find_by_id, next_id, read_data, write_data

router = APIRouter(prefix="/api/leave-requests", tags=["Leave Requests"])

FILE = "leave_requests"
LABEL = "Leave request"
ACTIVE_STATUSES = ("Pending", "Approved")  # rejected requests don't count


def _with_names(request: dict, names: dict, leave_types: list) -> dict:
    """Add employee and leave type names for the table (not saved)."""
    leave_type = find_by_id(leave_types, request["leave_type_id"])
    return {
        **request,
        "employee_name": names.get(request["employee_id"], "Unknown"),
        "leave_type_name": leave_type["name"] if leave_type else "Unknown",
    }


def _days_taken(requests: list, employee_id: str, leave_type_id: str, year: int, status: str) -> int:
    """Total days of one leave type that an employee has in a given year."""
    return sum(
        r["days"] for r in requests
        if r["employee_id"] == employee_id
        and r["leave_type_id"] == leave_type_id
        and r["status"] == status
        and r["start_date"].startswith(str(year))
    )


@router.get("")
def list_leave_requests(
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None,
    employee_id: Optional[str] = None,
    leave_type_id: Optional[str] = None,
):
    requests = read_data(FILE)
    if status:
        requests = [r for r in requests if r["status"] == status]
    if employee_id:
        requests = [r for r in requests if r["employee_id"] == employee_id]
    if leave_type_id:
        requests = [r for r in requests if r["leave_type_id"] == leave_type_id]

    names, leave_types = employee_names(), read_data("leave_types")
    # newest first
    requests = sorted(requests, key=lambda r: r["applied_on"], reverse=True)
    return [_with_names(r, names, leave_types) for r in requests]


@router.get("/balance/{employee_id}")
def leave_balance(employee_id: str, year: Optional[int] = None):
    """How many days of each leave type are used, pending and remaining."""
    if not find_by_id(read_data("employees"), employee_id):
        raise HTTPException(404, f"Employee '{employee_id}' not found")
    year = year or date.today().year
    requests = read_data(FILE)

    balance = []
    for lt in read_data("leave_types"):
        approved = _days_taken(requests, employee_id, lt["id"], year, "Approved")
        pending = _days_taken(requests, employee_id, lt["id"], year, "Pending")
        balance.append({
            "leave_type_id": lt["id"],
            "leave_type_name": lt["name"],
            "allowed": lt["days_per_year"],
            "approved": approved,
            "pending": pending,
            "remaining": lt["days_per_year"] - approved - pending,
        })
    return {"employee_id": employee_id, "year": year, "balance": balance}


@router.get("/{request_id}")
def get_leave_request(request_id: str):
    request = get_or_404(read_data(FILE), request_id, LABEL)
    return _with_names(request, employee_names(), read_data("leave_types"))


@router.post("", status_code=201)
def submit_leave_request(data: LeaveRequestIn):
    get_active_employee(data.employee_id)

    leave_type = find_by_id(read_data("leave_types"), data.leave_type_id)
    if not leave_type:
        raise HTTPException(400, f"Leave type '{data.leave_type_id}' does not exist")

    requests = read_data(FILE)
    start, end = data.start_date.isoformat(), data.end_date.isoformat()
    days = (data.end_date - data.start_date).days + 1  # both days included

    # Rule 1: no overlapping leave for the same employee
    for r in requests:
        if (r["employee_id"] == data.employee_id and r["status"] in ACTIVE_STATUSES
                and start <= r["end_date"] and end >= r["start_date"]):
            raise HTTPException(
                400, f"These dates overlap with {r['id']} ({r['start_date']} to {r['end_date']})")

    # Rule 2: enough balance left for this leave type this year
    year = data.start_date.year
    used = sum(_days_taken(requests, data.employee_id, leave_type["id"], year, s)
               for s in ACTIVE_STATUSES)
    remaining = leave_type["days_per_year"] - used
    if days > remaining:
        raise HTTPException(
            400, f"Not enough {leave_type['name']} balance: requested {days} day(s), "
                 f"only {remaining} left for {year}")

    new_request = {
        "id": next_id(requests, "LR"),
        "employee_id": data.employee_id,
        "leave_type_id": data.leave_type_id,
        "start_date": start,
        "end_date": end,
        "days": days,
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
def approve_leave_request(request_id: str, review: ReviewIn = ReviewIn()):
    return review_request(FILE, request_id, "Approved", review.hr_remarks, LABEL)


@router.patch("/{request_id}/reject")
def reject_leave_request(request_id: str, review: ReviewIn):
    return review_request(FILE, request_id, "Rejected", review.hr_remarks, LABEL)


@router.delete("/{request_id}")
def cancel_leave_request(request_id: str):
    return delete_pending_request(FILE, request_id, LABEL)
