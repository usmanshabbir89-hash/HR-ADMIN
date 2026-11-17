"""
routers/employees.py - Employee Master API.

GET   /api/employees                    list (optional ?search= &department_id= &status=)
GET   /api/employees/{id}               view one
POST  /api/employees                    add
PUT   /api/employees/{id}               edit
PATCH /api/employees/{id}/deactivate    mark Inactive (we never delete employees,
PATCH /api/employees/{id}/activate      because old requests still point to them)
"""
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from schemas import EmployeeIn
from storage import find_by_id, next_id, read_data, write_data

router = APIRouter(prefix="/api/employees", tags=["Employees"])

FILE = "employees"


def _with_department_name(employee: dict, departments: list) -> dict:
    """Add the department name so the table can show it (not saved to the file)."""
    department = find_by_id(departments, employee["department_id"])
    return {**employee, "department_name": department["name"] if department else "Unknown"}


def _check_rules(data: EmployeeIn, employees: list, current_id: Optional[str] = None):
    """Business rules shared by add and edit."""
    department = find_by_id(read_data("departments"), data.department_id)
    if not department:
        raise HTTPException(400, f"Department '{data.department_id}' does not exist")
    if department["status"] != "Active":
        raise HTTPException(400, f"Department '{department['name']}' is inactive")

    for e in employees:
        if e["id"] != current_id and e["email"].lower() == data.email:
            raise HTTPException(400, f"Email '{data.email}' is already used by {e['id']}")


def _get_or_404(employees: list, employee_id: str) -> dict:
    employee = find_by_id(employees, employee_id)
    if not employee:
        raise HTTPException(404, f"Employee '{employee_id}' not found")
    return employee


@router.get("")
def list_employees(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[Literal["Active", "Inactive"]] = None,
):
    employees = read_data(FILE)
    departments = read_data("departments")

    if department_id:
        employees = [e for e in employees if e["department_id"] == department_id]
    if status:
        employees = [e for e in employees if e["status"] == status]
    if search:
        s = search.lower()
        employees = [
            e for e in employees
            if s in e["id"].lower()
            or s in e["full_name"].lower()
            or s in e["email"].lower()
            or s in e["designation"].lower()
            or s in e["phone"]
        ]
    return [_with_department_name(e, departments) for e in employees]


@router.get("/{employee_id}")
def get_employee(employee_id: str):
    employee = _get_or_404(read_data(FILE), employee_id)
    return _with_department_name(employee, read_data("departments"))


@router.post("", status_code=201)
def create_employee(data: EmployeeIn):
    employees = read_data(FILE)
    _check_rules(data, employees)

    new_employee = {
        "id": next_id(employees, "EMP"),
        **data.model_dump(mode="json"),  # mode="json" turns dates into "YYYY-MM-DD" text
        "status": "Active",
    }
    employees.append(new_employee)
    write_data(FILE, employees)
    return new_employee


@router.put("/{employee_id}")
def update_employee(employee_id: str, data: EmployeeIn):
    employees = read_data(FILE)
    employee = _get_or_404(employees, employee_id)
    _check_rules(data, employees, current_id=employee_id)

    employee.update(data.model_dump(mode="json"))  # status is kept as it was
    write_data(FILE, employees)
    return employee


def _set_status(employee_id: str, new_status: str) -> dict:
    employees = read_data(FILE)
    employee = _get_or_404(employees, employee_id)
    if employee["status"] == new_status:
        raise HTTPException(400, f"Employee '{employee_id}' is already {new_status}")
    employee["status"] = new_status
    write_data(FILE, employees)
    return employee


@router.patch("/{employee_id}/deactivate")
def deactivate_employee(employee_id: str):
    return _set_status(employee_id, "Inactive")


@router.patch("/{employee_id}/activate")
def activate_employee(employee_id: str):
    return _set_status(employee_id, "Active")
