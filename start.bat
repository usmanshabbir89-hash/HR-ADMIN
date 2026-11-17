@echo off
REM ==========================================================
REM  start.bat - starts the whole HR Admin system with one click
REM  1. Backend  (FastAPI)  -> http://127.0.0.1:8000
REM  2. Frontend (React)    -> http://localhost:5173
REM  3. Opens the app in your browser
REM  Close the two black windows to stop the servers.
REM ==========================================================
cd /d "%~dp0"

if not exist "backend\venv\Scripts\python.exe" (
  echo Backend not installed yet. Run these first in the backend folder:
  echo     python -m venv venv
  echo     venv\Scripts\activate
  echo     pip install -r requirements.txt
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo Frontend packages not installed yet. Run "npm install" in the frontend folder first.
  pause
  exit /b 1
)

start "HR Admin - Backend (port 8000)" cmd /k "cd /d backend && venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
start "HR Admin - Frontend (port 5173)" cmd /k "cd /d frontend && npm run dev"

echo Starting servers...
timeout /t 5 /nobreak > nul
start "" http://localhost:5173
