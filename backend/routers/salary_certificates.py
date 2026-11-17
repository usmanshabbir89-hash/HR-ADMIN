"""
routers/salary_certificates.py - Generate salary certificates.

GET  /api/salary-certificates            list (?employee_id=)
GET  /api/salary-certificates/{id}       one certificate + company details (for printing)
POST /api/salary-certificates            generate a new certificate

The employee's details and salary are COPIED into the certificate when it is issued.
If the salary changes later, old certificates still show the correct old amount.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter

import settings
from helpers import get_active_employee, get_or_404, today
from schemas import SalaryCertificateIn
from storage import find_by_id, next_id, read_data, write_data

router = APIRouter(prefix="/api/salary-certificates", tags=["Salary Certificates"])

FILE = "salary_certificates"
LABEL = "Salary certificate"


def _next_certificate_no(certificates: list) -> str:
    """Numbers restart every year: HR/SC/2026/001, HR/SC/2026/002, ..."""
    year = date.today().year
    prefix = f"HR/SC/{year}/"
    count = sum(1 for c in certificates if c["certificate_no"].startswith(prefix))
    return f"{prefix}{count + 1:03d}"


def _company_details() -> dict:
    return {
        "name": settings.COMPANY_NAME,
        "address": settings.COMPANY_ADDRESS,
        "phone": settings.COMPANY_PHONE,
        "email": settings.COMPANY_EMAIL,
        "signatory": settings.HR_SIGNATORY,
        "currency": settings.CURRENCY,
    }


@router.get("")
def list_certificates(employee_id: Optional[str] = None):
    certificates = read_data(FILE)
    if employee_id:
        certificates = [c for c in certificates if c["employee_id"] == employee_id]
    return sorted(certificates, key=lambda c: c["certificate_no"], reverse=True)


@router.get("/{certificate_id}")
def get_certificate(certificate_id: str):
    certificate = get_or_404(read_data(FILE), certificate_id, LABEL)
    return {**certificate, "company": _company_details()}


@router.post("", status_code=201)
def generate_certificate(data: SalaryCertificateIn):
    employee = get_active_employee(data.employee_id)  # only current employees
    department = find_by_id(read_data("departments"), employee["department_id"])
    certificates = read_data(FILE)

    new_certificate = {
        "id": next_id(certificates, "SC"),
        "certificate_no": _next_certificate_no(certificates),
        "employee_id": employee["id"],
        # --- snapshot of the employee on the day of issue ---
        "employee_name": employee["full_name"],
        "designation": employee["designation"],
        "department_name": department["name"] if department else "",
        "join_date": employee["join_date"],
        "basic_salary": employee["basic_salary"],
        "allowances": employee["allowances"],
        "total_salary": employee["basic_salary"] + employee["allowances"],
        # ----------------------------------------------------
        "issue_date": today(),
        "purpose": data.purpose,
        "addressed_to": data.addressed_to,
    }
    certificates.append(new_certificate)
    write_data(FILE, certificates)
    return {**new_certificate, "company": _company_details()}
