"""
routers/attendance.py - Daily attendance API.

GET    /api/attendance               list (?date= &employee_id= &status= &month=YYYY-MM)
GET    /api/attendance/{id}          view one
POST   /api/attendance               mark attendance (status is calculated automatically)
PUT    /api/attendance/{id}          correct a record
DELETE /api/attendance/{id}          remove a record

Status rules (see settings.py):
  no check-in             -> Absent
  check-in after 09:15    -> Late
  otherwise               -> Present
"""
from datetime import datetime, time
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from helpers import employee_names, get_active_employee, get_or_404
from schemas import AttendanceIn
from settings import LATE_AFTER
from storage import next_id, read_data, write_data

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

FILE = "attendance"
LABEL = "Attendance record"


def work_out_status(check_in: Optional[time]) -> str:
    if check_in is None:
        return "Absent"
    if check_in > LATE_AFTER:
        return "Late"
    return "Present"


def _hours_worked(record: dict) -> Optional[float]:
    if not record.get("check_in") or not record.get("check_out"):
        return None
    start = datetime.strptime(record["check_in"], "%H:%M")
    end = datetime.strptime(record["check_out"], "%H:%M")
    return round((end - start).total_seconds() / 3600, 2)


def _with_extra_info(record: dict, names: dict) -> dict:
    return {
        **record,
        "employee_name": names.get(record["employee_id"], "Unknown"),
        "hours_worked": _hours_worked(record),
    }


def _to_record(data: AttendanceIn) -> dict:
    """Turn the validated form into the shape we save in attendance.json."""
    return {
        "employee_id": data.employee_id,
        "date": data.date.isoformat(),
        "check_in": data.check_in.strftime("%H:%M") if data.check_in else None,
        "check_out": data.check_out.strftime("%H:%M") if data.check_out else None,
        "status": work_out_status(data.check_in),
        "remarks": data.remarks,
    }


def _check_not_duplicate(records: list, employee_id: str, day: str, current_id: Optional[str] = None):
    """Only one attendance record per employee per day."""
    for r in records:
        if r["id"] != current_id and r["employee_id"] == employee_id and r["date"] == day:
            raise HTTPException(400, f"Attendance for {employee_id} on {day} already exists ({r['id']})")


@router.get("")
def list_attendance(
    date: Optional[str] = None,
    employee_id: Optional[str] = None,
    status: Optional[Literal["Present", "Late", "Absent"]] = None,
    month: Optional[str] = None,  # e.g. "2026-11"
):
    records = read_data(FILE)
    if date:
        records = [r for r in records if r["date"] == date]
    if month:
        records = [r for r in records if r["date"].startswith(month)]
    if employee_id:
        records = [r for r in records if r["employee_id"] == employee_id]
    if status:
        records = [r for r in records if r["status"] == status]

    names = employee_names()
    records = sorted(records, key=lambda r: (r["date"], r["employee_id"]), reverse=True)
    return [_with_extra_info(r, names) for r in records]


@router.get("/{record_id}")
def get_attendance(record_id: str):
    return _with_extra_info(get_or_404(read_data(FILE), record_id, LABEL), employee_names())


@router.post("", status_code=201)
def mark_attendance(data: AttendanceIn):
    get_active_employee(data.employee_id)
    records = read_data(FILE)
    _check_not_duplicate(records, data.employee_id, data.date.isoformat())

    new_record = {"id": next_id(records, "AT"), **_to_record(data)}
    records.append(new_record)
    write_data(FILE, records)
    return new_record


@router.put("/{record_id}")
def update_attendance(record_id: str, data: AttendanceIn):
    records = read_data(FILE)
    record = get_or_404(records, record_id, LABEL)
    get_active_employee(data.employee_id)
    _check_not_duplicate(records, data.employee_id, data.date.isoformat(), current_id=record_id)

    record.update(_to_record(data))  # status is re-calculated
    write_data(FILE, records)
    return record


@router.delete("/{record_id}")
def delete_attendance(record_id: str):
    records = read_data(FILE)
    record = get_or_404(records, record_id, LABEL)
    records.remove(record)
    write_data(FILE, records)
    return {"message": f"{LABEL} '{record_id}' deleted"}
