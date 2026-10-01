@echo off
echo ========================================================
echo  Running CoalIntel Comprehensive Test Suite
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate.bat
python -m unittest discover backend/tests -p "test_*.py" -v
pause
