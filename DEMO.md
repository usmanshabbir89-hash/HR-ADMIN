# Demo Script — Mini HR Admin Management System

A step-by-step plan for presenting the project to your teacher (about **10–12 minutes**).
**Click** = what to do · **Say** = what to explain.

---

## Before the demo (5 minutes earlier)
1. Reset the sample data so the numbers match this script:
   ```bash
   git checkout -- backend/data
   ```
2. Double-click **`start.bat`** (or start backend + frontend in two terminals).
3. Open these tabs in the browser:
   - http://localhost:5173 — the app
   - http://127.0.0.1:8000/docs — the API documentation
4. Open the project in **VS Code** with `backend/data/leave_requests.json` ready in a tab.

> The sample data is dated around **17 November 2026**, so open the Attendance page on that date if today is different.

---

## 1. Introduction (1 min)
**Say:** "This is a Mini HR Admin system. The frontend is React with Vite, the backend is a Python FastAPI
REST API, and instead of a database every module saves its data in its own JSON file. It has 9 modules."

**Click:** show the sidebar — Dashboard, People, Leave, Time, Payroll.

---

## 2. Dashboard (1 min)
**Click:** Dashboard.

**Say:** "The dashboard has no data file of its own — the API counts from the other files.
5 active employees, 3 present, 1 late, 1 absent today, 3 pending requests and the monthly payroll.
All pending requests from every module are in one table, oldest first."

---

## 3. Employees (2 min)
**Click:** Employees → type `ali` in the search → clear it → choose *Information Technology* in the filter.

**Say:** "Search and filters are sent to the API as query parameters."

**Click:** **Add employee**. Fill in a name, use the email `ali.raza@company.com`, choose Finance,
any join date, salary `70000`. Click **Add employee**.

**Say:** "The server checks that the email is unique and shows the error." *(red message appears)*

**Click:** change the email to something new → **Add employee** → *"… added as EMP007"*.

**Say:** "The ID is created automatically. Employees are never deleted — only deactivated —
because old requests still point to their ID."

**Click:** the 🚫 icon on the new employee → **Deactivate** → filter Status = *Inactive*.

**Click:** the name *Ali Raza* → profile page with leave balance and attendance history.

---

## 4. Departments (30 s)
**Click:** Departments → 🗑 on *Finance* → **Delete**.

**Say:** "Blocked — the server refuses to delete a department that still has employees."

---

## 5. Leave (2 min)
**Click:** Leave Types → show the four cards (days per year, paid / unpaid).

**Click:** Leave Requests → **New request** → Fatima Noor, *Emergency Leave*, 14 Dec → 18 Dec, any reason.

**Say:** "The form counts 5 days and shows only 3 are left." **Click:** Submit →
*"Not enough Emergency Leave balance"*.

**Click:** change the end date to 16 Dec → Submit → *"LR004 submitted (3 days)"*.

**Click:** ✗ Reject on **LR001** → leave remarks empty → Reject → *"Please write a reason"*.
Type *"Project deadline"* → Reject.

**Say:** "Now look at the JSON file." **Switch to VS Code** → `leave_requests.json` →
LR001 now has `"status": "Rejected"`, `reviewed_on` and `hr_remarks`.

**Say:** "Approved or rejected requests are final — the buttons disappear."

---

## 6. Short leave and salary requests (1 min)
**Click:** Short Leave → **New short leave** → from 09:00 to 15:00 → *"more than the 4-hour limit"*.

**Click:** Salary Requests → **New request** → Fatima Noor, *Salary Advance*, amount `200000`.

**Say:** "Her gross salary is PKR 90,000 — an advance can't be more than one month's salary."

**Click:** ✓ Approve on **SR001** → Approve.

---

## 7. Attendance (1 min)
**Click:** Attendance → show 3 Present · 1 Late · 1 Absent → ◀ previous day → everyone is *Not marked*.

**Click:** **Mark** on Ayesha → check-in `09:40` → the preview says **Late** → Save.

**Say:** "The status is calculated by the server: no check-in is Absent, after 09:15 is Late."

---

## 8. Salary certificate (1 min)
**Click:** Salary Certificates → **Generate certificate** → Ali Raza, purpose *Visa application* → Generate.

**Say:** "The salary is copied onto the certificate on the day it is issued, so old certificates
stay correct even if the salary changes. The amount is also written in words."

**Click:** **Print / Save as PDF** → show the print preview (sidebar and buttons are hidden).

---

## 9. Behind the scenes (1–2 min)
**Click:** the `/docs` tab → open `POST /api/leave-requests` → **Try it out** → **Execute** with an
end date before the start date → 422 error.

**Say:** "FastAPI checks every request with Pydantic before it reaches the data."

**Show in VS Code:** `backend/storage.py` → `write_data()`.

**Say:** "Data is written to a temporary file first and then swapped in with `os.replace`,
so a crash can never corrupt a JSON file."

**Optional:** run the automatic tests:
```bash
cd backend
python test_api.py
```
→ *"59/59 checks passed"*.

**Show:** the GitHub repository with one commit per phase.

---

## Questions your teacher may ask
| Question | Answer |
|---|---|
| Why JSON files and not a database? | The assignment requires it. Each module has its own file; `storage.py` reads and writes them safely. |
| What happens if two people save at the same time? | A thread lock in `storage.py` lets only one write happen at a time. |
| How do you stop wrong data? | Two layers: the form checks basic things in the browser, and the server checks every rule (Pydantic + business rules) before saving. |
| How are employees linked to requests? | Every record stores `employee_id`. The API adds the employee's name when it sends data to the screen. |
| Why can't employees be deleted? | Old leave, attendance and certificates would point to an employee that no longer exists. Deactivating keeps history correct. |
| How is "Late" decided? | `settings.py` sets `LATE_AFTER = 09:15`; `attendance.py` compares the check-in time. |
| What is REST? | Each URL is a resource (`/api/employees`) and the HTTP method says the action: GET read, POST create, PUT update, PATCH partial change, DELETE remove. |
| What is CORS / the Vite proxy? | The browser blocks calls between different ports. Vite forwards `/api` to port 8000, and FastAPI also allows port 5173. |
| What is `useState` / `useEffect`? | `useState` holds data that changes the screen; `useEffect` runs code when the page opens or a value changes (e.g. loading data). |
| How would you add login? | Add a users file, a `/api/login` endpoint returning a token, and check the token on every request. |
