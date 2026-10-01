Write-Host "========================================================" -ForegroundColor Green
Write-Host " CoalIntel — Starting Full Platform (Backend + Frontend)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$Root = $PSScriptRoot

Write-Host "`n[1/2] Launching Backend API Server (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; & '.\.venv\Scripts\Activate.ps1'; uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Launching Frontend UI (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\frontend'; npm run dev"

Write-Host "`nCoalIntel is running!" -ForegroundColor Green
Write-Host " - Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host " - Frontend: http://localhost:5173" -ForegroundColor White
