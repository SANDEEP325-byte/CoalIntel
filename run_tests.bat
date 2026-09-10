@echo off
echo ========================================================
echo  Running CoalIntel Comprehensive Test Suite
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate.bat
python -m unittest backend/tests/test_coalintel_suite.py
pause
