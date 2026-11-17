"""
routers/salary_requests.py - Salary-related requests (advance, increment, correction, loan...).

GET    /api/salary-requests                 list (?status= &employee_id= &request_type=)
GET    /api/salary-requests/{id}            view one
POST   /api/salary-requests                 submit (status starts as "Pending")
PATCH  /api/salary-requests/{id}/approve    HR approves
PATCH  /api/salary-requests/{id}/reject     HR rejects (remarks required)
DELETE /api/salary-requests/{id}            cancel (only while Pending)
"""
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from helpers import (delete_pending_request, employee_names, get_active_employee,
                     get_or_404, review_request, today)
from schemas import ReviewIn, SalaryRequestIn
from settings import CURRENCY
from storage import next_id, read_data, write_data

router = APIRouter(prefix="/api/salary-requests", tags=["Salary Requests"])

FILE = "salary_requests"
LABEL = "Salary request"


def _with_name(request: dict, names: dict) -> dict:
    return {**request, "employee_name": names.get(request["employee_id"], "Unknown")}


@router.get("")
def list_salary_requests(
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None,
    employee_id: Optional[str] = None,
    request_type: Optional[str] = None,
):
    requests = read_data(FILE)
    if status:
        requests = [r for r in requests if r["status"] == status]
    if employee_id:
        requests = [r for r in requests if r["employee_id"] == employee_id]
    if request_type:
        requests = [r for r in requests if r["request_type"] == request_type]

    names = employee_names()
    requests = sorted(requests, key=lambda r: r["requested_on"], reverse=True)
    return [_with_name(r, names) for r in requests]


@router.get("/{request_id}")
def get_salary_request(request_id: str):
    return _with_name(get_or_404(read_data(FILE), request_id, LABEL), employee_names())


@router.post("", status_code=201)
def submit_salary_request(data: SalaryRequestIn):
    employee = get_active_employee(data.employee_id)
    requests = read_data(FILE)

    # Rule 1: only one Pending request of the same type per employee
    for r in requests:
        if (r["employee_id"] == data.employee_id and r["request_type"] == data.request_type
                and r["status"] == "Pending"):
            raise HTTPException(
                400, f"{data.employee_id} already has a Pending '{data.request_type}' ({r['id']})")

    # Rule 2: a salary advance cannot be more than one month's gross salary
    gross = employee["basic_salary"] + employee["allowances"]
    if data.request_type == "Salary Advance" and data.amount > gross:
        raise HTTPException(
            400, f"Salary advance cannot be more than one month's gross salary ({CURRENCY} {gross:,.0f})")

    new_request = {
        "id": next_id(requests, "SR"),
        "employee_id": data.employee_id,
        "request_type": data.request_type,
        "amount": data.amount,
        "reason": data.reason,
        "status": "Pending",
        "requested_on": today(),
        "reviewed_on": None,
        "hr_remarks": "",
    }
    requests.append(new_request)
    write_data(FILE, requests)
    return new_request


@router.patch("/{request_id}/approve")
def approve_salary_request(request_id: str, review: ReviewIn = ReviewIn()):
    return review_request(FILE, request_id, "Approved", review.hr_remarks, LABEL)


@router.patch("/{request_id}/reject")
def reject_salary_request(request_id: str, review: ReviewIn):
    return review_request(FILE, request_id, "Rejected", review.hr_remarks, LABEL)


@router.delete("/{request_id}")
def cancel_salary_request(request_id: str):
    return delete_pending_request(FILE, request_id, LABEL)
