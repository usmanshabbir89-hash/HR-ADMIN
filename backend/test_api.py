"""
test_api.py - Automatic tests for the whole API.

How to run (from the backend folder, with the venv active):
    python test_api.py

What it does:
  1. Copies the data folder to a temporary folder (your real data is never changed)
  2. Starts the API on port 8001 using that copy
  3. Sends real HTTP requests and checks every answer
  4. Prints PASS / FAIL for each check and a final score
  5. Stops the server and deletes the temporary copy
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

BACKEND = Path(__file__).parent
PORT = 8001
BASE = f"http://127.0.0.1:{PORT}"
results = []


# ---------------------------------------------------------------- helpers
def call(method, path, body=None):
    """Send one request; return (status_code, json_body)."""
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


def check(label, result, expected_status, condition=None):
    """Record PASS if the status matches (and the optional condition is true)."""
    status, body = result
    ok = status == expected_status and (condition is None or condition(body))
    results.append(ok)
    message = body.get("detail", "") if isinstance(body, dict) else f"{len(body)} items"
    if isinstance(message, list):
        message = "; ".join(item["msg"] for item in message)
    print(f"  {'PASS' if ok else 'FAIL'}  [{status}] {label}" + (f"  ->  {message}" if message else ""))
    return body


def section(title):
    print(f"\n{title}")


def wait_for_server(timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(BASE + "/api/health")
            return True
        except Exception:
            time.sleep(0.3)
    return False


# ---------------------------------------------------------------- tests
def run_tests():
    section("Health")
    check("all JSON files readable", call("GET", "/api/health"), 200, lambda b: b["status"] == "ok")

    section("Employees")
    emp = {"full_name": "Test Person", "email": "Test.Person@company.com", "phone": "0300-7777777",
           "department_id": "DEP03", "designation": "Developer", "join_date": "2025-01-01",
           "basic_salary": 100000, "allowances": 5000}
    check("list employees", call("GET", "/api/employees"), 200, lambda b: len(b) == 6)
    check("search 'ali'", call("GET", "/api/employees?search=ali"), 200, lambda b: len(b) == 1)
    check("filter department + status", call("GET", "/api/employees?department_id=DEP03&status=Active"), 200)
    check("unknown employee -> 404", call("GET", "/api/employees/EMP999"), 404)
    check("add employee (ID made automatically)", call("POST", "/api/employees", emp), 201, lambda b: b["id"] == "EMP007")
    check("duplicate email blocked", call("POST", "/api/employees", emp), 400)
    check("bad email + negative salary -> 422", call("POST", "/api/employees", {**emp, "email": "bad", "basic_salary": -5}), 422)
    check("unknown department blocked", call("POST", "/api/employees", {**emp, "email": "x@y.com", "department_id": "DEP99"}), 400)
    check("future join date blocked", call("POST", "/api/employees", {**emp, "email": "z@y.com", "join_date": "2099-01-01"}), 422)
    check("edit employee", call("PUT", "/api/employees/EMP007", {**emp, "designation": "Senior Developer"}), 200)
    check("deactivate", call("PATCH", "/api/employees/EMP007/deactivate"), 200, lambda b: b["status"] == "Inactive")
    check("deactivate twice blocked", call("PATCH", "/api/employees/EMP007/deactivate"), 400)
    check("activate", call("PATCH", "/api/employees/EMP007/activate"), 200)

    section("Departments")
    dep = {"name": "Marketing", "code": "mkt", "head_employee_id": "", "description": "Brand"}
    check("list departments", call("GET", "/api/departments"), 200, lambda b: len(b) == 4)
    check("add department (code made uppercase)", call("POST", "/api/departments", dep), 201, lambda b: b["code"] == "MKT")
    check("duplicate name blocked", call("POST", "/api/departments", {**dep, "code": "MK2"}), 400)
    check("unknown head employee blocked", call("PUT", "/api/departments/DEP05", {**dep, "head_employee_id": "EMP999"}), 400)
    check("delete department with employees blocked", call("DELETE", "/api/departments/DEP01"), 400)
    check("delete empty department", call("DELETE", "/api/departments/DEP05"), 200)

    section("Leave types")
    lt = {"name": "Maternity Leave", "code": "mat", "days_per_year": 90, "is_paid": True}
    check("list leave types", call("GET", "/api/leave-types"), 200, lambda b: len(b) == 4)
    check("add leave type", call("POST", "/api/leave-types", lt), 201)
    check("more than 365 days blocked", call("POST", "/api/leave-types", {**lt, "name": "X Leave", "code": "X1", "days_per_year": 400}), 422)
    check("delete leave type in use blocked", call("DELETE", "/api/leave-types/LT01"), 400)
    check("delete unused leave type", call("DELETE", "/api/leave-types/LT05"), 200)

    section("Leave requests")
    lr = {"employee_id": "EMP005", "leave_type_id": "LT01", "start_date": "2026-12-01", "end_date": "2026-12-03", "reason": "Wedding"}
    check("submit leave (days counted by server)", call("POST", "/api/leave-requests", lr), 201, lambda b: b["days"] == 3 and b["status"] == "Pending")
    check("overlapping dates blocked", call("POST", "/api/leave-requests", {**lr, "start_date": "2026-12-03", "end_date": "2026-12-04"}), 400)
    check("end before start -> 422", call("POST", "/api/leave-requests", {**lr, "start_date": "2026-12-10", "end_date": "2026-12-05"}), 422)
    check("inactive employee blocked", call("POST", "/api/leave-requests", {**lr, "employee_id": "EMP006"}), 400)
    check("not enough balance blocked", call("POST", "/api/leave-requests", {**lr, "leave_type_id": "LT03", "start_date": "2026-12-14", "end_date": "2026-12-18"}), 400)
    check("leave balance", call("GET", "/api/leave-requests/balance/EMP005?year=2026"), 200, lambda b: b["balance"][0]["remaining"] == 18)
    check("reject without remarks blocked", call("PATCH", "/api/leave-requests/LR004/reject", {}), 400)
    check("approve", call("PATCH", "/api/leave-requests/LR004/approve"), 200, lambda b: b["status"] == "Approved")
    check("approve twice blocked", call("PATCH", "/api/leave-requests/LR004/approve"), 400)
    check("cancel approved request blocked", call("DELETE", "/api/leave-requests/LR004"), 400)
    check("reject with remarks", call("PATCH", "/api/leave-requests/LR001/reject", {"hr_remarks": "Deadline"}), 200)

    section("Short leave")
    sl = {"employee_id": "EMP003", "date": "2026-11-20", "from_time": "11:00", "to_time": "13:30", "reason": "Bank visit"}
    check("submit short leave (hours counted)", call("POST", "/api/short-leaves", sl), 201, lambda b: b["hours"] == 2.5)
    check("overlapping time blocked", call("POST", "/api/short-leaves", {**sl, "from_time": "13:00", "to_time": "14:00"}), 400)
    check("to-time before from-time -> 422", call("POST", "/api/short-leaves", {**sl, "from_time": "15:00", "to_time": "14:00"}), 422)
    check("more than 4 hours -> 422", call("POST", "/api/short-leaves", {**sl, "from_time": "09:00", "to_time": "15:00"}), 422)
    check("approve short leave", call("PATCH", "/api/short-leaves/SL001/approve"), 200)
    check("cancel pending short leave", call("DELETE", "/api/short-leaves/SL003"), 200)

    section("Attendance")
    day = "2026-11-10"
    check("09:15 check-in -> Present", call("POST", "/api/attendance", {"employee_id": "EMP001", "date": day, "check_in": "09:15", "check_out": "17:00"}), 201, lambda b: b["status"] == "Present")
    check("09:16 check-in -> Late", call("POST", "/api/attendance", {"employee_id": "EMP002", "date": day, "check_in": "09:16"}), 201, lambda b: b["status"] == "Late")
    check("no check-in -> Absent", call("POST", "/api/attendance", {"employee_id": "EMP003", "date": day}), 201, lambda b: b["status"] == "Absent")
    check("same employee same day blocked", call("POST", "/api/attendance", {"employee_id": "EMP001", "date": day, "check_in": "09:00"}), 400)
    check("check-out before check-in -> 422", call("POST", "/api/attendance", {"employee_id": "EMP004", "date": day, "check_in": "10:00", "check_out": "09:00"}), 422)
    check("future date -> 422", call("POST", "/api/attendance", {"employee_id": "EMP004", "date": "2099-01-01", "check_in": "09:00"}), 422)
    check("filter by date", call("GET", f"/api/attendance?date={day}"), 200, lambda b: len(b) == 3)

    section("Salary requests")
    sr = {"employee_id": "EMP005", "request_type": "Salary Advance", "amount": 20000, "reason": "House rent"}
    check("submit salary request", call("POST", "/api/salary-requests", sr), 201)
    check("second pending advance blocked", call("POST", "/api/salary-requests", sr), 400)
    check("advance above gross salary blocked", call("POST", "/api/salary-requests", {**sr, "employee_id": "EMP003", "amount": 999999}), 400)
    check("amount 0 -> 422", call("POST", "/api/salary-requests", {**sr, "amount": 0}), 422)
    check("approve salary request", call("PATCH", "/api/salary-requests/SR003/approve", {"hr_remarks": "OK"}), 200)

    section("Salary certificates")
    check("generate certificate", call("POST", "/api/salary-certificates", {"employee_id": "EMP002", "purpose": "Visa"}), 201,
          lambda b: b["total_salary"] == 140000 and b["certificate_no"].startswith("HR/SC/"))
    check("inactive employee blocked", call("POST", "/api/salary-certificates", {"employee_id": "EMP006", "purpose": "Visa"}), 400)
    check("view certificate with company details", call("GET", "/api/salary-certificates/SC001"), 200, lambda b: "company" in b)

    section("Dashboard")
    check("summary numbers", call("GET", "/api/dashboard/summary?date=2026-11-17"), 200,
          lambda b: b["employees"]["active"] == 6 and b["attendance"]["late"] == 1)
    check("pending list", call("GET", "/api/dashboard/pending"), 200, lambda b: all(i["endpoint"] for i in b))


# ---------------------------------------------------------------- main
def main():
    temp_dir = Path(tempfile.mkdtemp(prefix="hr_test_"))
    shutil.copytree(BACKEND / "data", temp_dir / "data")
    env = {**os.environ, "HR_DATA_DIR": str(temp_dir / "data")}

    print(f"Starting test server on port {PORT} using a temporary copy of the data...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", str(PORT)],
        cwd=BACKEND, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        if not wait_for_server():
            print("Could not start the test server. Is port 8001 free?")
            return 1
        run_tests()
    finally:
        server.terminate()
        server.wait(timeout=10)
        shutil.rmtree(temp_dir, ignore_errors=True)

    passed = sum(results)
    print(f"\nResult: {passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
