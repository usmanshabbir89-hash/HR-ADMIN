"""
routers/dashboard.py - Numbers for the HR Admin Dashboard.

GET /api/dashboard/summary   stat cards (?date= defaults to today)
GET /api/dashboard/pending   every Pending request from all modules in one list

The dashboard has NO JSON file of its own - it counts data from the other files.
"""
from typing import Optional

from fastapi import APIRouter

from helpers import employee_names, today
from settings import CURRENCY
from storage import read_data

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _count(items: list, **conditions) -> int:
    """Count items where every key equals the given value. _count(x, status="Pending")"""
    return sum(1 for i in items if all(i.get(k) == v for k, v in conditions.items()))


@router.get("/summary")
def summary(date: Optional[str] = None):
    day = date or today()
    employees = read_data("employees")
    departments = read_data("departments")
    attendance = [a for a in read_data("attendance") if a["date"] == day]
    leave_requests = read_data("leave_requests")
    short_leaves = read_data("short_leave_requests")
    salary_requests = read_data("salary_requests")

    active_ids = {e["id"] for e in employees if e["status"] == "Active"}
    marked_ids = {a["employee_id"] for a in attendance}
    on_leave_ids = {
        r["employee_id"] for r in leave_requests
        if r["status"] == "Approved" and r["start_date"] <= day <= r["end_date"]
    }

    pending = {
        "leave": _count(leave_requests, status="Pending"),
        "short_leave": _count(short_leaves, status="Pending"),
        "salary": _count(salary_requests, status="Pending"),
    }
    pending["total"] = sum(pending.values())

    return {
        "date": day,
        "employees": {
            "total": len(employees),
            "active": len(active_ids),
            "inactive": len(employees) - len(active_ids),
        },
        "departments": len(departments),
        "attendance": {
            "present": _count(attendance, status="Present"),
            "late": _count(attendance, status="Late"),
            "absent": _count(attendance, status="Absent"),
            "on_leave": len(on_leave_ids & active_ids),
            # active employees with no attendance record and not on leave
            "not_marked": len(active_ids - marked_ids - on_leave_ids),
        },
        "pending_requests": pending,
        "employees_per_department": [
            {
                "department": d["name"],
                "count": sum(1 for e in employees
                             if e["department_id"] == d["id"] and e["status"] == "Active"),
            }
            for d in departments
        ],
        "monthly_payroll": {
            "currency": CURRENCY,
            "amount": sum(e["basic_salary"] + e["allowances"]
                          for e in employees if e["status"] == "Active"),
        },
    }


@router.get("/pending")
def pending_requests():
    """All Pending requests together, oldest first (they have waited longest)."""
    names = employee_names()
    leave_types = {lt["id"]: lt["name"] for lt in read_data("leave_types")}
    items = []

    for r in read_data("leave_requests"):
        if r["status"] == "Pending":
            items.append({
                "type": "Leave",
                "id": r["id"],
                "employee_id": r["employee_id"],
                "employee_name": names.get(r["employee_id"], "Unknown"),
                "details": f"{leave_types.get(r['leave_type_id'], 'Leave')}: "
                           f"{r['start_date']} to {r['end_date']} ({r['days']} day(s))",
                "submitted_on": r["applied_on"],
                "endpoint": f"/api/leave-requests/{r['id']}",
            })

    for r in read_data("short_leave_requests"):
        if r["status"] == "Pending":
            items.append({
                "type": "Short Leave",
                "id": r["id"],
                "employee_id": r["employee_id"],
                "employee_name": names.get(r["employee_id"], "Unknown"),
                "details": f"{r['date']}, {r['from_time']} - {r['to_time']}",
                "submitted_on": r["applied_on"],
                "endpoint": f"/api/short-leaves/{r['id']}",
            })

    for r in read_data("salary_requests"):
        if r["status"] == "Pending":
            items.append({
                "type": "Salary",
                "id": r["id"],
                "employee_id": r["employee_id"],
                "employee_name": names.get(r["employee_id"], "Unknown"),
                "details": f"{r['request_type']}: {CURRENCY} {r['amount']:,.0f}",
                "submitted_on": r["requested_on"],
                "endpoint": f"/api/salary-requests/{r['id']}",
            })

    # The frontend approves with PATCH {endpoint}/approve and rejects with PATCH {endpoint}/reject
    return sorted(items, key=lambda i: i["submitted_on"])
