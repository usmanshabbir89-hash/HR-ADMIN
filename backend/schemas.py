"""
schemas.py - Describes what data the API accepts (validation rules).

FastAPI uses these Pydantic classes to check every request automatically.
If a field is missing or wrong, the API replies with error 422 and explains why,
so bad data never reaches our JSON files.
"""
from datetime import date, datetime, time
from datetime import date as DateType
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Simple email check: something@something.something
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
# Phone: digits, spaces, + and - only, 7 to 20 characters
PHONE_PATTERN = r"^[0-9+\-\s]{7,20}$"


class CleanModel(BaseModel):
    """Base class: removes extra spaces from the start/end of all text fields."""
    model_config = ConfigDict(str_strip_whitespace=True)


# ---------------- Departments ----------------
class DepartmentIn(CleanModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=10)
    head_employee_id: Optional[str] = None
    description: str = Field("", max_length=300)
    status: Literal["Active", "Inactive"] = "Active"

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, value: str) -> str:
        return value.upper()

    @field_validator("head_employee_id")
    @classmethod
    def empty_head_is_none(cls, value):
        # An empty "" from a form means "no head selected"
        return value or None


# ---------------- Employees ----------------
class EmployeeIn(CleanModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=EMAIL_PATTERN, max_length=120)
    phone: str = Field(..., pattern=PHONE_PATTERN)
    department_id: str = Field(..., min_length=1)
    designation: str = Field(..., min_length=2, max_length=100)
    join_date: date
    basic_salary: float = Field(..., ge=0)
    allowances: float = Field(0, ge=0)

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, value: str) -> str:
        return value.lower()

    @field_validator("join_date")
    @classmethod
    def join_date_not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Join date cannot be in the future")
        return value


# ---------------- Leave Types (Leave Master) ----------------
class LeaveTypeIn(CleanModel):
    name: str = Field(..., min_length=2, max_length=50)
    code: str = Field(..., min_length=2, max_length=20)
    days_per_year: int = Field(..., ge=0, le=365)
    is_paid: bool = True
    description: str = Field("", max_length=300)

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, value: str) -> str:
        return value.upper()


# ---------------- Leave Requests ----------------
class LeaveRequestIn(CleanModel):
    employee_id: str = Field(..., min_length=1)
    leave_type_id: str = Field(..., min_length=1)
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3, max_length=300)

    @model_validator(mode="after")
    def end_after_start(self):
        # model_validator checks two fields together
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


# ---------------- Short Leave Requests ----------------
MAX_SHORT_LEAVE_HOURS = 4


class ShortLeaveIn(CleanModel):
    employee_id: str = Field(..., min_length=1)
    date: DateType  # DateType = date (renamed so the field name "date" doesn't clash)
    from_time: time  # accepts "10:00"
    to_time: time
    reason: str = Field(..., min_length=3, max_length=300)

    @model_validator(mode="after")
    def check_times(self):
        if self.to_time <= self.from_time:
            raise ValueError("'To time' must be after 'from time'")
        if self.hours() > MAX_SHORT_LEAVE_HOURS:
            raise ValueError(f"Short leave cannot be longer than {MAX_SHORT_LEAVE_HOURS} hours")
        return self

    def hours(self) -> float:
        start = datetime.combine(self.date, self.from_time)
        end = datetime.combine(self.date, self.to_time)
        return round((end - start).total_seconds() / 3600, 2)


# ---------------- Approve / Reject ----------------
class ReviewIn(CleanModel):
    hr_remarks: str = Field("", max_length=300)


# ---------------- Attendance ----------------
class AttendanceIn(CleanModel):
    employee_id: str = Field(..., min_length=1)
    date: DateType
    check_in: Optional[time] = None   # empty = employee was absent
    check_out: Optional[time] = None
    remarks: str = Field("", max_length=200)

    @model_validator(mode="after")
    def check_times(self):
        if self.date > date.today():
            raise ValueError("Attendance cannot be marked for a future date")
        if self.check_out and not self.check_in:
            raise ValueError("Check-out needs a check-in time")
        if self.check_in and self.check_out and self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in")
        return self


# ---------------- Salary Requests ----------------
SALARY_REQUEST_TYPES = Literal[
    "Salary Advance", "Salary Increment", "Salary Correction", "Loan", "Other"
]


class SalaryRequestIn(CleanModel):
    employee_id: str = Field(..., min_length=1)
    request_type: SALARY_REQUEST_TYPES
    amount: float = Field(..., gt=0)  # must be more than 0
    reason: str = Field(..., min_length=3, max_length=300)


# ---------------- Salary Certificates ----------------
class SalaryCertificateIn(CleanModel):
    employee_id: str = Field(..., min_length=1)
    purpose: str = Field(..., min_length=3, max_length=200)
    addressed_to: str = Field("To Whom It May Concern", min_length=3, max_length=200)
