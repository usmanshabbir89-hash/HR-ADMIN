# Mini HR Admin Management System

Student project: React (Vite) + FastAPI + JSON file storage (no database).

## Project structure
```
backend/
  data/            JSON files (one per module)
  routers/         One file of endpoints per module
    departments.py
    employees.py
    leave_types.py
    leave_requests.py
    short_leaves.py
    attendance.py
    salary_requests.py
    salary_certificates.py
    dashboard.py
  helpers.py       Shared rules for requests (approve/reject, active employee)
  settings.py      Company details, currency, office start / late time
  main.py          FastAPI app (entry point)
  schemas.py       Validation rules (Pydantic)
  storage.py       Safe JSON read/write helpers
  requirements.txt Python packages
frontend/
  src/
    pages/         One file per screen (Dashboard.jsx, ...)
    components/    Reusable pieces (Layout, StatCard, ReviewDialog, ...)
    api.js         All calls to the backend
    navigation.js  Sidebar menu
    index.css      Styling
  vite.config.js   Dev server; forwards /api to the backend
```

## Run the backend (Windows)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- API home: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/api/health
- Interactive API docs (Swagger): http://127.0.0.1:8000/docs

> On some Windows PCs the command is `py` instead of `python` (e.g. `py -m venv venv`).

## Run the frontend
Needs **Node.js 18 or newer**. Keep the backend running, then in a second terminal:
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — the HR Admin dashboard.

## API endpoints (so far)
| Method | Path | Purpose |
|---|---|---|
| GET | /api/employees?search=&department_id=&status= | List employees with search and filters |
| GET | /api/employees/{id} | View one employee |
| POST | /api/employees | Add employee |
| PUT | /api/employees/{id} | Edit employee |
| PATCH | /api/employees/{id}/deactivate | Mark employee Inactive |
| PATCH | /api/employees/{id}/activate | Mark employee Active |
| GET | /api/departments?search= | List departments |
| GET | /api/departments/{id} | View one department |
| POST | /api/departments | Add department |
| PUT | /api/departments/{id} | Edit department |
| DELETE | /api/departments/{id} | Delete department (only if it has no employees) |
| GET / POST | /api/leave-types | List / add leave types |
| GET / PUT / DELETE | /api/leave-types/{id} | View / edit / delete (only if unused) |
| GET | /api/leave-requests?status=&employee_id=&leave_type_id= | List leave requests |
| GET | /api/leave-requests/balance/{employee_id}?year= | Leave balance per type |
| POST | /api/leave-requests | Submit leave (checks overlap and balance) |
| PATCH | /api/leave-requests/{id}/approve | Approve (optional `hr_remarks`) |
| PATCH | /api/leave-requests/{id}/reject | Reject (`hr_remarks` required) |
| DELETE | /api/leave-requests/{id} | Cancel a Pending request |
| GET | /api/short-leaves?status=&employee_id=&date= | List short leaves |
| POST | /api/short-leaves | Submit short leave (max 4 hours, no overlap) |
| PATCH | /api/short-leaves/{id}/approve · /reject | Approve / reject |
| DELETE | /api/short-leaves/{id} | Cancel a Pending request |
| GET | /api/attendance?date=&employee_id=&status=&month= | List attendance |
| POST | /api/attendance | Mark attendance (status calculated automatically) |
| GET / PUT / DELETE | /api/attendance/{id} | View / correct / delete a record |
| GET | /api/salary-requests?status=&employee_id=&request_type= | List salary requests |
| POST | /api/salary-requests | Submit salary request |
| PATCH | /api/salary-requests/{id}/approve · /reject | Approve / reject |
| DELETE | /api/salary-requests/{id} | Cancel a Pending request |
| GET | /api/salary-certificates?employee_id= | List certificates |
| GET | /api/salary-certificates/{id} | One certificate with company details (for printing) |
| POST | /api/salary-certificates | Generate a certificate |
| GET | /api/dashboard/summary?date= | Dashboard stat cards |
| GET | /api/dashboard/pending | All pending requests in one list |

## Business rules
- Requests can only be made for an existing, **Active** employee.
- Only **Pending** requests can be approved, rejected or cancelled.
- Rejecting a request requires HR remarks.
- Leave: end date ≥ start date, no overlapping leave, and enough yearly balance for that leave type.
- Short leave: to time > from time, at most 4 hours, no overlap on the same day.
- Attendance: one record per employee per day, no future dates. No check-in = **Absent**,
  check-in after 09:15 = **Late**, otherwise **Present** (times set in `settings.py`).
- Salary requests: amount > 0, one Pending request of each type per employee,
  a salary advance cannot exceed one month's gross salary.
- Salary certificates: only for Active employees; salary details are copied into the
  certificate on the day it is issued. Numbers look like `HR/SC/2026/001`.
