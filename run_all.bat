@echo off
echo ========================================================
echo  CoalIntel — Starting Full Platform (Backend + Frontend)
echo ========================================================
cd /d "%~dp0"

echo [1/2] Launching Backend API Server (FastAPI on Port 8000)...
start "CoalIntel Backend" cmd /k "call run_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend UI (Vite on Port 5173)...
start "CoalIntel Frontend" cmd /k "call run_frontend.bat"

echo.
echo ========================================================
echo  CoalIntel is running!
echo  - Backend API: http://127.0.0.1:8000
echo  - Frontend UI: http://localhost:5173
echo ========================================================
