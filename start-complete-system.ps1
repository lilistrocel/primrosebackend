#!/usr/bin/env powershell
# Complete Coffee Machine System Startup Script

Write-Host "================================================================" -ForegroundColor Blue
Write-Host "  COMPLETE COFFEE MACHINE SYSTEM STARTUP" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = netstat -ano | findstr ":$Port"
        if ($processes) {
            $processes | ForEach-Object {
                $parts = $_ -split '\s+'
                $pid = $parts[-1]
                if ($pid -match '^\d+$') {
                    Write-Host "Stopping process $pid on port $Port..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep 2
        }
    } catch {
        Write-Host "Could not stop processes on port $Port" -ForegroundColor Red
    }
}

# 1. Start Backend (Port 3000)
Write-Host "`n[1/4] Starting Backend Server..." -ForegroundColor Green
if (Test-Port 3000) {
    Write-Host "Port 3000 is busy, cleaning up..." -ForegroundColor Yellow
    Stop-ProcessOnPort 3000
}

Write-Host "Starting backend on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized
Start-Sleep 5

if (Test-Port 3000) {
    Write-Host "[OK] Backend is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend failed to start" -ForegroundColor Red
    exit 1
}

# 2. Start Frontend (Port 3001)
Write-Host "`n[2/4] Starting Frontend Application..." -ForegroundColor Green
if (Test-Port 3001) {
    Write-Host "Port 3001 is busy, cleaning up..." -ForegroundColor Yellow
    Stop-ProcessOnPort 3001
}

Write-Host "Starting frontend on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run frontend:start" -WindowStyle Minimized
Start-Sleep 8

if (Test-Port 3001) {
    Write-Host "[OK] Frontend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend failed to start" -ForegroundColor Red
}

# 3. Start Mock Machine Dashboard (Port 3002)
Write-Host "`n[3/4] Starting Mock Machine Dashboard..." -ForegroundColor Green
if (Test-Port 3002) {
    Write-Host "Port 3002 is busy, cleaning up..." -ForegroundColor Yellow
    Stop-ProcessOnPort 3002
}

Write-Host "Starting mock machine dashboard on port 3002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD\mock-machine'; node src/ui-server.js" -WindowStyle Minimized
Start-Sleep 3

if (Test-Port 3002) {
    Write-Host "[OK] Mock Machine Dashboard is running on port 3002" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Mock Machine Dashboard failed to start" -ForegroundColor Red
}

# 4. Start Mock Machine Simulator
Write-Host "`n[4/4] Starting Mock Machine Simulator..." -ForegroundColor Green
Write-Host "Starting coffee machine simulator..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD\mock-machine'; node src/machine.js --poll-interval 3000 --verbose" -WindowStyle Minimized
Start-Sleep 3

Write-Host "[OK] Mock Machine Simulator started" -ForegroundColor Green

# Summary
Write-Host "`n================================================================" -ForegroundColor Blue
Write-Host "  SYSTEM STATUS" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue

$backendStatus = if (Test-Port 3000) { "RUNNING" } else { "FAILED" }
$frontendStatus = if (Test-Port 3001) { "RUNNING" } else { "FAILED" }
$dashboardStatus = if (Test-Port 3002) { "RUNNING" } else { "FAILED" }

Write-Host "Backend Server (3000):     $backendStatus" -ForegroundColor $(if($backendStatus -eq "RUNNING") {"Green"} else {"Red"})
Write-Host "Frontend App (3001):       $frontendStatus" -ForegroundColor $(if($frontendStatus -eq "RUNNING") {"Green"} else {"Red"})
Write-Host "Machine Dashboard (3002):  $dashboardStatus" -ForegroundColor $(if($dashboardStatus -eq "RUNNING") {"Green"} else {"Red"})
Write-Host "Mock Machine Simulator:    RUNNING" -ForegroundColor Green

Write-Host "`n================================================================" -ForegroundColor Blue
Write-Host "  ACCESS POINTS" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "Backend API:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend Management: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Machine Dashboard:  http://localhost:3002" -ForegroundColor Cyan
Write-Host "`nOrder Monitor:      http://localhost:3001/orders" -ForegroundColor Yellow
Write-Host "Item Management:    http://localhost:3001/items" -ForegroundColor Yellow

Write-Host "`n================================================================" -ForegroundColor Blue
Write-Host "  NOTES" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "- The mock machine is now polling the backend every 3 seconds" -ForegroundColor White
Write-Host "- Orders in processing should appear in the dashboard" -ForegroundColor White
Write-Host "- Refresh the dashboard (F5) to see live updates" -ForegroundColor White
Write-Host "- Use Ctrl+C in any window to stop individual services" -ForegroundColor White

Write-Host "`nPress any key to exit this script (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
