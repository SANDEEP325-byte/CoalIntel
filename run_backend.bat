@echo off
echo ========================================================
echo  Starting CoalIntel Backend (FastAPI + MongoDB + Gemini)
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate.bat
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause
