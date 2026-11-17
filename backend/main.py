"""
main.py - Starting point of the Mini HR Admin API.
Run with:  uvicorn main:app --reload
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import (attendance, dashboard, departments, employees, leave_requests,
                     leave_types, salary_certificates, salary_requests, short_leaves)
from storage import read_data

app = FastAPI(
    title="Mini HR Admin API",
    description="REST API for the Mini HR Admin Management System (JSON storage)",
    version="1.0.0",
)

# CORS: allows our React app (running on port 5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# If a JSON file is broken, storage.py raises RuntimeError.
# This handler turns it into a clear JSON error instead of a crash page.
@app.exception_handler(RuntimeError)
def storage_error_handler(request: Request, exc: RuntimeError):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# Each module lives in its own file inside the "routers" folder
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(leave_types.router)
app.include_router(leave_requests.router)
app.include_router(short_leaves.router)
app.include_router(attendance.router)
app.include_router(salary_requests.router)
app.include_router(salary_certificates.router)
app.include_router(dashboard.router)

DATA_FILES = [
    "departments", "employees", "leave_types", "leave_requests",
    "short_leave_requests", "attendance", "salary_requests", "salary_certificates",
]


@app.get("/")
def home():
    return {"message": "Mini HR Admin API is running. Visit /docs to test it."}


@app.get("/api/health", tags=["Health"])
def health_check():
    """Shows that every JSON file can be read, and how many records each has."""
    return {
        "status": "ok",
        "record_counts": {name: len(read_data(name)) for name in DATA_FILES},
    }
