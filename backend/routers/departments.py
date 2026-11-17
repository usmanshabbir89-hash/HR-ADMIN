"""
routers/departments.py - Department Master API (CRUD).

GET    /api/departments          list (optional ?search=)
GET    /api/departments/{id}     view one
POST   /api/departments          create
PUT    /api/departments/{id}     update
DELETE /api/departments/{id}     delete (only if no employees are in it)
"""
from typing import Optional

from fastapi import APIRouter, HTTPException

from schemas import DepartmentIn
from storage import find_by_id, next_id, read_data, write_data

router = APIRouter(prefix="/api/departments", tags=["Departments"])

FILE = "departments"


def _with_extra_info(department: dict, employees: list) -> dict:
    """Add the number of employees and the head's name (shown in the table, not saved)."""
    head = find_by_id(employees, department.get("head_employee_id"))
    return {
        **department,
        "employee_count": sum(1 for e in employees if e["department_id"] == department["id"]),
        "head_name": head["full_name"] if head else None,
    }


def _check_rules(data: DepartmentIn, departments: list, current_id: Optional[str] = None):
    """Business rules shared by create and update."""
    for d in departments:
        if d["id"] == current_id:
            continue  # skip the department we are editing
        if d["name"].lower() == data.name.lower():
            raise HTTPException(400, f"A department named '{data.name}' already exists")
        if d["code"] == data.code:
            raise HTTPException(400, f"Department code '{data.code}' is already used")

    if data.head_employee_id and not find_by_id(read_data("employees"), data.head_employee_id):
        raise HTTPException(400, f"Head employee '{data.head_employee_id}' does not exist")


@router.get("")
def list_departments(search: Optional[str] = None):
    departments = read_data(FILE)
    employees = read_data("employees")
    if search:
        s = search.lower()
        departments = [
            d for d in departments
            if s in d["name"].lower() or s in d["code"].lower() or s in d["id"].lower()
        ]
    return [_with_extra_info(d, employees) for d in departments]


@router.get("/{department_id}")
def get_department(department_id: str):
    department = find_by_id(read_data(FILE), department_id)
    if not department:
        raise HTTPException(404, f"Department '{department_id}' not found")
    return _with_extra_info(department, read_data("employees"))


@router.post("", status_code=201)
def create_department(data: DepartmentIn):
    departments = read_data(FILE)
    _check_rules(data, departments)

    new_department = {"id": next_id(departments, "DEP", width=2), **data.model_dump()}
    departments.append(new_department)
    write_data(FILE, departments)
    return new_department


@router.put("/{department_id}")
def update_department(department_id: str, data: DepartmentIn):
    departments = read_data(FILE)
    department = find_by_id(departments, department_id)
    if not department:
        raise HTTPException(404, f"Department '{department_id}' not found")
    _check_rules(data, departments, current_id=department_id)

    department.update(data.model_dump())  # changes the dict inside the list
    write_data(FILE, departments)
    return department


@router.delete("/{department_id}")
def delete_department(department_id: str):
    departments = read_data(FILE)
    department = find_by_id(departments, department_id)
    if not department:
        raise HTTPException(404, f"Department '{department_id}' not found")

    in_use = [e["id"] for e in read_data("employees") if e["department_id"] == department_id]
    if in_use:
        raise HTTPException(
            400,
            f"Cannot delete: {len(in_use)} employee(s) belong to this department. "
            "Move them to another department first.",
        )

    departments.remove(department)
    write_data(FILE, departments)
    return {"message": f"Department '{department_id}' deleted"}
