"""
helpers.py - Small functions shared by all the "request" modules
(leave, short leave and, in Phase 4, salary requests).

Writing them once here means every module follows the same rules.
"""
from datetime import date

from fastapi import HTTPException

from storage import find_by_id, read_data, write_data


def today() -> str:
    """Today's date as text, e.g. '2026-11-17' (the format we store in JSON)."""
    return date.today().isoformat()


def get_active_employee(employee_id: str) -> dict:
    """Requests can only be made for an employee who exists and is Active."""
    employee = find_by_id(read_data("employees"), employee_id)
    if not employee:
        raise HTTPException(400, f"Employee '{employee_id}' does not exist")
    if employee["status"] != "Active":
        raise HTTPException(400, f"Employee '{employee_id}' is inactive")
    return employee


def employee_names() -> dict:
    """A quick lookup: {'EMP001': 'Ayesha Khan', ...}"""
    return {e["id"]: e["full_name"] for e in read_data("employees")}


def get_or_404(items: list, item_id: str, label: str) -> dict:
    item = find_by_id(items, item_id)
    if not item:
        raise HTTPException(404, f"{label} '{item_id}' not found")
    return item


def review_request(file: str, request_id: str, new_status: str, remarks: str, label: str) -> dict:
    """
    Approve or reject any request.
    Rules:
      - only a Pending request can be reviewed
      - rejecting needs a reason (HR remarks)
    """
    items = read_data(file)
    request = get_or_404(items, request_id, label)

    if request["status"] != "Pending":
        raise HTTPException(400, f"{label} '{request_id}' is already {request['status']}")
    if new_status == "Rejected" and not remarks:
        raise HTTPException(400, "Please give a reason (HR remarks) when rejecting")

    request["status"] = new_status
    request["reviewed_on"] = today()
    request["hr_remarks"] = remarks
    write_data(file, items)
    return request


def delete_pending_request(file: str, request_id: str, label: str) -> dict:
    """Cancel (delete) a request - allowed only while it is still Pending."""
    items = read_data(file)
    request = get_or_404(items, request_id, label)
    if request["status"] != "Pending":
        raise HTTPException(400, f"Only Pending requests can be cancelled (this one is {request['status']})")
    items.remove(request)
    write_data(file, items)
    return {"message": f"{label} '{request_id}' cancelled"}
