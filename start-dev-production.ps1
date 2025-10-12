# Coffee Machine Development - Production Mode (Minimal Logging)
# Starts backend in production mode with minimal debugging output
#
# Usage:
#   .\start-dev-production.ps1                    # Normal mode
#   .\start-dev-production.ps1 -SkipInstall       # Skip dependency installation

param(
    [switch]$SkipInstall,
    [int]$BackendPort = 3000,
    [int]$FrontendPort = 3001
)

# Colors for output
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorText {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    param($Text)
    Write-Host ""
    Write-ColorText "===============================================================" "Cyan"
    Write-ColorText "  $Text" "Yellow"
    Write-ColorText "===============================================================" "Cyan"
    Write-Host ""
}

function Test-Port {
    param($Port)
    try {
        # Use 127.0.0.1 instead of localhost to avoid IPv6 warnings
        $connection = Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-ColorText "[INFO] Skipping dependency installation" "Yellow"
        return
    }
    
    Write-Header "INSTALLING DEPENDENCIES"
    
    if (Test-Path "package.json") {
        Write-ColorText "Installing backend dependencies..." "Blue"
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "[ERROR] Backend dependency installation failed" "Red"
            exit 1
        }
        Write-ColorText "[OK] Backend dependencies installed" "Green"
    }
    
    if (Test-Path "frontend/package.json") {
        Write-ColorText "Installing frontend dependencies..." "Blue"
        Push-Location "frontend"
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "[ERROR] Frontend dependency installation failed" "Red"
            Pop-Location
            exit 1
        }
        Write-ColorText "[OK] Frontend dependencies installed" "Green"
        Pop-Location
    }
}

function Initialize-Database {
    Write-Header "CHECKING DATABASE"
    
    if (-not (Test-Path "coffee_machine.db")) {
        Write-ColorText "Creating database with mock data..." "Blue"
        npm run init-db
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "[OK] Database initialized successfully" "Green"
        } else {
            Write-ColorText "[ERROR] Database initialization failed" "Red"
            exit 1
        }
    } else {
        Write-ColorText "[OK] Database already exists" "Green"
    }
}

function Start-Backend {
    Write-Header "STARTING BACKEND (PRODUCTION MODE)"
    
    # Kill any existing process on backend port
    $existingProcess = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "[WARNING] Port $BackendPort is in use, freeing it..." "Yellow"
        Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Write-ColorText "Starting backend on port $BackendPort with minimal logging..." "Blue"
    
    # Start backend in background using production mode
    $backendJob = Start-Job -ScriptBlock {
        param($Port)
        Set-Location $using:PWD
        $env:PORT = $Port
        $env:NODE_ENV = "production"
        npm run start:clean
    } -ArgumentList $BackendPort
    
    # Wait for backend to start
    $attempts = 0
    $maxAttempts = 30
    
    do {
        Start-Sleep -Seconds 1
        $attempts++
        $backendRunning = Test-Port -Port $BackendPort
        Write-Host "." -NoNewline -ForegroundColor Yellow
    } while (-not $backendRunning -and $attempts -lt $maxAttempts)
    
    Write-Host ""
    
    if ($backendRunning) {
        Write-ColorText "[OK] Backend started successfully" "Green"
        Write-ColorText "    URL: http://localhost:$BackendPort" "Cyan"
    } else {
        Write-ColorText "[ERROR] Backend failed to start" "Red"
        exit 1
    }
    
    return $backendJob
}

function Start-Frontend {
    Write-Header "STARTING FRONTEND"
    
    if (-not (Test-Path "frontend")) {
        Write-ColorText "[WARNING] Frontend directory not found" "Yellow"
        return $null
    }
    
    # Kill any existing process on frontend port
    $existingProcess = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "[WARNING] Port $FrontendPort is in use, freeing it..." "Yellow"
        Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Write-ColorText "Starting frontend on port $FrontendPort..." "Blue"
    
    # Start frontend in background
    $frontendJob = Start-Job -ScriptBlock {
        param($Port)
        Set-Location $using:PWD
        Push-Location "frontend"
        $env:PORT = $Port
        $env:BROWSER = "none"
        npm start 2>&1 | Out-Null
        Pop-Location
    } -ArgumentList $FrontendPort
    
    # Wait for frontend to start
    $attempts = 0
    $maxAttempts = 60
    
    do {
        Start-Sleep -Seconds 1
        $attempts++
        $frontendRunning = Test-Port -Port $FrontendPort
        Write-Host "." -NoNewline -ForegroundColor Yellow
    } while (-not $frontendRunning -and $attempts -lt $maxAttempts)
    
    Write-Host ""
    
    if ($frontendRunning) {
        Write-ColorText "[OK] Frontend started successfully" "Green"
        Write-ColorText "    URL: http://localhost:$FrontendPort" "Cyan"
    } else {
        Write-ColorText "[WARNING] Frontend failed to start" "Yellow"
    }
    
    return $frontendJob
}

function Show-Status {
    Write-Header "SYSTEM STATUS"
    
    $backendOK = Test-Port -Port $BackendPort
    $frontendOK = Test-Port -Port $FrontendPort
    
    Write-ColorText "Backend:  $(if ($backendOK) { '✅ Running' } else { '❌ Stopped' })" $(if ($backendOK) { 'Green' } else { 'Red' })
    Write-ColorText "Frontend: $(if ($frontendOK) { '✅ Running' } else { '❌ Stopped' })" $(if ($frontendOK) { 'Green' } else { 'Red' })
    
    Write-Host ""
    Write-ColorText "Access Points:" "White"
    Write-ColorText "  Backend:  http://localhost:$BackendPort/api/motong/" "Cyan"
    Write-ColorText "  Frontend: http://localhost:$FrontendPort/" "Cyan"
    Write-ColorText "  Kiosk:    http://localhost:$FrontendPort/kiosk" "Cyan"
    Write-Host ""
    Write-ColorText "Press Ctrl+C to stop services" "Yellow"
}

# Main script execution
try {
    Write-Header "COFFEE MACHINE - PRODUCTION MODE"
    Write-ColorText "Minimal logging for clean development experience" "Gray"
    
    Install-Dependencies
    Initialize-Database
    
    $backendJob = Start-Backend
    $frontendJob = Start-Frontend
    
    Show-Status
    
    # Store job info for cleanup
    $Global:BackendJob = $backendJob
    $Global:FrontendJob = $frontendJob
    
    # Keep script running
    Write-ColorText "`nMonitoring services..." "Gray"
    while ($true) {
        Start-Sleep -Seconds 30
        
        $backendOK = Test-Port -Port $BackendPort
        $frontendOK = Test-Port -Port $FrontendPort
        
        if (-not $backendOK -or -not $frontendOK) {
            Write-ColorText "`n[WARNING] Service issue detected!" "Red"
            Show-Status
        }
    }
    
} catch {
    Write-ColorText "[ERROR] Error occurred: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # Cleanup jobs on exit
    if ($Global:BackendJob) {
        Write-ColorText "`n[INFO] Stopping backend..." "Yellow"
        Stop-Job $Global:BackendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:BackendJob -ErrorAction SilentlyContinue
    }
    
    if ($Global:FrontendJob) {
        Write-ColorText "[INFO] Stopping frontend..." "Yellow"
        Stop-Job $Global:FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:FrontendJob -ErrorAction SilentlyContinue
    }
    
    Write-ColorText "Services stopped" "Green"
}

