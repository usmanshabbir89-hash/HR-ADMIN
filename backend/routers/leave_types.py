"""
routers/leave_types.py - Leave Master API (Annual, Sick, Emergency, Unpaid...).

GET    /api/leave-types          list
GET    /api/leave-types/{id}     view one
POST   /api/leave-types          create
PUT    /api/leave-types/{id}     update
DELETE /api/leave-types/{id}     delete (only if no leave request uses it)
"""
from typing import Optional

from fastapi import APIRouter, HTTPException

from helpers import get_or_404
from schemas import LeaveTypeIn
from storage import next_id, read_data, write_data

router = APIRouter(prefix="/api/leave-types", tags=["Leave Types"])

FILE = "leave_types"
LABEL = "Leave type"


def _check_unique(data: LeaveTypeIn, leave_types: list, current_id: Optional[str] = None):
    for lt in leave_types:
        if lt["id"] == current_id:
            continue
        if lt["name"].lower() == data.name.lower():
            raise HTTPException(400, f"Leave type '{data.name}' already exists")
        if lt["code"] == data.code:
            raise HTTPException(400, f"Leave code '{data.code}' is already used")


@router.get("")
def list_leave_types():
    return read_data(FILE)


@router.get("/{leave_type_id}")
def get_leave_type(leave_type_id: str):
    return get_or_404(read_data(FILE), leave_type_id, LABEL)


@router.post("", status_code=201)
def create_leave_type(data: LeaveTypeIn):
    leave_types = read_data(FILE)
    _check_unique(data, leave_types)
    new_type = {"id": next_id(leave_types, "LT", width=2), **data.model_dump()}
    leave_types.append(new_type)
    write_data(FILE, leave_types)
    return new_type


@router.put("/{leave_type_id}")
def update_leave_type(leave_type_id: str, data: LeaveTypeIn):
    leave_types = read_data(FILE)
    leave_type = get_or_404(leave_types, leave_type_id, LABEL)
    _check_unique(data, leave_types, current_id=leave_type_id)
    leave_type.update(data.model_dump())
    write_data(FILE, leave_types)
    return leave_type


@router.delete("/{leave_type_id}")
def delete_leave_type(leave_type_id: str):
    leave_types = read_data(FILE)
    leave_type = get_or_404(leave_types, leave_type_id, LABEL)
    used = sum(1 for r in read_data("leave_requests") if r["leave_type_id"] == leave_type_id)
    if used:
        raise HTTPException(400, f"Cannot delete: {used} leave request(s) use this leave type")
    leave_types.remove(leave_type)
    write_data(FILE, leave_types)
    return {"message": f"Leave type '{leave_type_id}' deleted"}
