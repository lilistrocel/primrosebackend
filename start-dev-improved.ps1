# Coffee Machine Development Startup Script (Improved Version)
# Starts backend, frontend, and monitors system health with proper job management
#
# Usage:
#   .\start-dev-improved.ps1                    # Normal mode (background services)
#   .\start-dev-improved.ps1 -ShowLogs         # Debug mode (shows real-time backend logs)
#   .\start-dev-improved.ps1 -HealthOnly       # Health check only
#   .\start-dev-improved.ps1 -SkipInstall       # Skip dependency installation

param(
    [switch]$SkipInstall,
    [switch]$Quiet,
    [switch]$HealthOnly,
    [switch]$ShowLogs,
    [int]$BackendPort = 3000,
    [int]$FrontendPort = 3001
)

# Colors for output
$Host.UI.RawUI.ForegroundColor = "White"

# Global variables for job tracking
$Global:BackendJob = $null
$Global:FrontendJob = $null
$Global:JobTrackerFile = "$PSScriptRoot\.dev-jobs.json"

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

function Save-JobTracker {
    $jobInfo = @{
        BackendJobId = if ($Global:BackendJob) { $Global:BackendJob.Id } else { $null }
        FrontendJobId = if ($Global:FrontendJob) { $Global:FrontendJob.Id } else { $null }
        BackendPort = $BackendPort
        FrontendPort = $FrontendPort
        StartTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    $jobInfo | ConvertTo-Json | Out-File -FilePath $Global:JobTrackerFile -Encoding UTF8
}

function Load-JobTracker {
    if (Test-Path $Global:JobTrackerFile) {
        try {
            $jobInfo = Get-Content $Global:JobTrackerFile -Raw | ConvertFrom-Json
            return $jobInfo
        } catch {
            Write-ColorText "[WARNING] Could not load job tracker file" "Yellow"
        }
    }
    return $null
}

function Cleanup-ExistingJobs {
    Write-ColorText "Cleaning up any existing development jobs..." "Blue"
    
    # Load previous job info
    $previousJobs = Load-JobTracker
    if ($previousJobs) {
        Write-ColorText "Found previous job session from $($previousJobs.StartTime)" "Gray"
        
        # Try to stop previous jobs
        if ($previousJobs.BackendJobId) {
            $oldBackendJob = Get-Job -Id $previousJobs.BackendJobId -ErrorAction SilentlyContinue
            if ($oldBackendJob) {
                Write-ColorText "  Stopping previous backend job (ID: $($previousJobs.BackendJobId))" "Gray"
                Stop-Job $oldBackendJob -ErrorAction SilentlyContinue
                Remove-Job $oldBackendJob -ErrorAction SilentlyContinue
            }
        }
        
        if ($previousJobs.FrontendJobId) {
            $oldFrontendJob = Get-Job -Id $previousJobs.FrontendJobId -ErrorAction SilentlyContinue
            if ($oldFrontendJob) {
                Write-ColorText "  Stopping previous frontend job (ID: $($previousJobs.FrontendJobId))" "Gray"
                Stop-Job $oldFrontendJob -ErrorAction SilentlyContinue
                Remove-Job $oldFrontendJob -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Stop any existing jobs
    $existingJobs = Get-Job -ErrorAction SilentlyContinue
    if ($existingJobs) {
        Write-ColorText "  Found $($existingJobs.Count) existing job(s), cleaning up..." "Gray"
        foreach ($job in $existingJobs) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
        }
    }
    
    # Remove job tracker file
    if (Test-Path $Global:JobTrackerFile) {
        Remove-Item $Global:JobTrackerFile -ErrorAction SilentlyContinue
    }
}

function Test-Port {
    param($Port, $ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-ColorText "[OK] $ServiceName is running on port $Port" "Green"
            return $true
        } else {
            Write-ColorText "[ERROR] $ServiceName is not responding on port $Port" "Red"
            return $false
        }
    } catch {
        Write-ColorText "[ERROR] Cannot check $ServiceName on port $Port" "Red"
        return $false
    }
}

function Test-BackendHealth {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$BackendPort/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.status -eq "OK") {
            Write-ColorText "[OK] Backend health check: OK" "Green"
            Write-ColorText "   Service: $($response.service)" "Gray"
            Write-ColorText "   Database: $($response.database)" "Gray"
            return $true
        }
    } catch {
        Write-ColorText "[ERROR] Backend health check failed: $($_.Exception.Message)" "Red"
    }
    return $false
}

function Test-FrontendHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorText "[OK] Frontend is serving correctly" "Green"
            return $true
        }
    } catch {
        Write-ColorText "[ERROR] Frontend health check failed: $($_.Exception.Message)" "Red"
    }
    return $false
}

function Show-SystemInfo {
    Write-Header "COFFEE MACHINE DEVELOPMENT ENVIRONMENT"
    Write-ColorText "Node.js Version: $(node --version)" "Green"
    Write-ColorText "NPM Version: $(npm --version)" "Green"
    Write-ColorText "PowerShell Version: $($PSVersionTable.PSVersion)" "Green"
    Write-ColorText "Working Directory: $(Get-Location)" "Green"
    Write-Host ""
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-ColorText "[INFO] Skipping dependency installation" "Yellow"
        return
    }
    
    Write-Header "INSTALLING DEPENDENCIES"
    
    # Backend dependencies
    if (Test-Path "package.json") {
        Write-ColorText "Installing backend dependencies..." "Blue"
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "[OK] Backend dependencies installed" "Green"
        } else {
            Write-ColorText "[ERROR] Backend dependency installation failed" "Red"
            exit 1
        }
    }
    
    # Frontend dependencies
    if (Test-Path "frontend/package.json") {
        Write-ColorText "Installing frontend dependencies..." "Blue"
        Push-Location "frontend"
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "[OK] Frontend dependencies installed" "Green"
        } else {
            Write-ColorText "[ERROR] Frontend dependency installation failed" "Red"
            Pop-Location
            exit 1
        }
        Pop-Location
    }
}

function Initialize-Database {
    Write-Header "INITIALIZING DATABASE"
    
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
    Write-Header "STARTING BACKEND SERVER"
    
    # Kill any existing process on backend port
    $existingProcess = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "[WARNING] Port $BackendPort is in use, attempting to free it..." "Yellow"
        Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Write-ColorText "Starting backend on port $BackendPort..." "Blue"
    
    if ($ShowLogs) {
        Write-ColorText "[DEBUG MODE] Backend logs will be shown in real-time" "Yellow"
        Write-ColorText "Look for: 'MACHINE API CALL DETECTED:' for machine communication" "Green"
        Write-ColorText "Press Ctrl+C to stop services and exit" "Yellow"
        Write-Host ""
        
        # Start backend in foreground for live logging
        $env:PORT = $BackendPort
        npm start
        return $null  # No job object since running in foreground
    } else {
        # Start backend in background with proper job tracking
        $backendJob = Start-Job -Name "CoffeeBackend" -ScriptBlock {
            param($Port, $WorkingDir)
            Set-Location $WorkingDir
            $env:PORT = $Port
            npm start
        } -ArgumentList $BackendPort, $PWD
        
        $Global:BackendJob = $backendJob
        
        # Wait for backend to start
        Write-ColorText "Waiting for backend to start..." "Yellow"
        $attempts = 0
        $maxAttempts = 30
        
        do {
            Start-Sleep -Seconds 1
            $attempts++
            $backendRunning = Test-Port -Port $BackendPort -ServiceName "Backend"
            if (-not $Quiet) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        } while (-not $backendRunning -and $attempts -lt $maxAttempts)
        
        Write-Host ""
        
        if ($backendRunning) {
            Start-Sleep -Seconds 2  # Give it a moment to fully initialize
            Test-BackendHealth
            Write-ColorText "Backend URL: http://localhost:$BackendPort" "Cyan"
            Write-ColorText "Health Check: http://localhost:$BackendPort/health" "Cyan"
            Write-ColorText "API Base: http://localhost:$BackendPort/api/motong/" "Cyan"
        } else {
            Write-ColorText "[ERROR] Backend failed to start within $maxAttempts seconds" "Red"
            exit 1
        }
        
        return $backendJob
    }
}

function Start-Frontend {
    Write-Header "STARTING FRONTEND APPLICATION"
    
    if (-not (Test-Path "frontend")) {
        Write-ColorText "[ERROR] Frontend directory not found" "Red"
        return $null
    }
    
    # Kill any existing process on frontend port
    $existingProcess = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "[WARNING] Port $FrontendPort is in use, attempting to free it..." "Yellow"
        Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Write-ColorText "Starting frontend on port $FrontendPort..." "Blue"
    
    # Start frontend in background with proper job tracking
    $frontendJob = Start-Job -Name "CoffeeFrontend" -ScriptBlock {
        param($Port, $WorkingDir)
        Set-Location $WorkingDir
        Push-Location "frontend"
        $env:PORT = $Port
        $env:BROWSER = "none"  # Don't auto-open browser
        npm start
        Pop-Location
    } -ArgumentList $FrontendPort, $PWD
    
    $Global:FrontendJob = $frontendJob
    
    # Wait for frontend to start
    Write-ColorText "Waiting for frontend to start..." "Yellow"
    $attempts = 0
    $maxAttempts = 60  # Frontend takes longer to start
    
    do {
        Start-Sleep -Seconds 1
        $attempts++
        $frontendRunning = Test-Port -Port $FrontendPort -ServiceName "Frontend"
        if (-not $Quiet) {
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    } while (-not $frontendRunning -and $attempts -lt $maxAttempts)
    
    Write-Host ""
    
    if ($frontendRunning) {
        Start-Sleep -Seconds 3  # Give React time to fully load
        Test-FrontendHealth
        Write-ColorText "Frontend URL: http://localhost:$FrontendPort" "Cyan"
        Write-ColorText "Management Interface: http://localhost:$FrontendPort" "Cyan"
    } else {
        Write-ColorText "[ERROR] Frontend failed to start within $maxAttempts seconds" "Red"
        Write-ColorText "   Check 'npm install' was successful in frontend directory" "Yellow"
    }
    
    return $frontendJob
}

function Show-HealthStatus {
    Write-Header "SYSTEM HEALTH CHECK"
    
    # Test services
    $backendOK = Test-Port -Port $BackendPort -ServiceName "Backend"
    $frontendOK = Test-Port -Port $FrontendPort -ServiceName "Frontend"
    
    if ($backendOK) {
        Test-BackendHealth
    }
    
    if ($frontendOK) {
        Test-FrontendHealth
    }
    
    Write-Host ""
    
    # Overall status
    if ($backendOK -and $frontendOK) {
        Write-ColorText "[SUCCESS] ALL SYSTEMS OPERATIONAL" "Green"
        Write-ColorText "   Coffee Machine Management System is ready!" "Green"
    } elseif ($backendOK) {
        Write-ColorText "[WARNING] BACKEND ONLY RUNNING" "Yellow"
        Write-ColorText "   Coffee machine can connect, but no web interface" "Yellow"
    } elseif ($frontendOK) {
        Write-ColorText "[WARNING] FRONTEND ONLY RUNNING" "Yellow"
        Write-ColorText "   Web interface available, but no backend connection" "Yellow"
    } else {
        Write-ColorText "[ERROR] SYSTEM DOWN" "Red"
        Write-ColorText "   Neither backend nor frontend is running" "Red"
    }
}

function Show-URLs {
    Write-Header "ACCESS POINTS"
    Write-ColorText "Backend Services:" "White"
    Write-ColorText "  Health Check:    http://localhost:$BackendPort/health" "Cyan"
    Write-ColorText "  API Endpoint:    http://localhost:$BackendPort/api/motong/" "Cyan"
    Write-ColorText "  Server Info:     http://localhost:$BackendPort/" "Cyan"
    Write-Host ""
    Write-ColorText "Frontend Application:" "White"
    Write-ColorText "  Management UI:   http://localhost:$FrontendPort/" "Cyan"
    Write-ColorText "  Item Manager:    http://localhost:$FrontendPort/items" "Cyan"
    Write-ColorText "  Order Monitor:   http://localhost:$FrontendPort/orders" "Cyan"
    Write-ColorText "  Alert Dashboard: http://localhost:$FrontendPort/alerts" "Cyan"
    Write-ColorText "  Device Status:   http://localhost:$FrontendPort/device" "Cyan"
    Write-Host ""
    Write-ColorText "Coffee Machine Configuration:" "White"
    Write-ColorText "  Change machine URL to: http://localhost:$BackendPort/api/motong/" "Yellow"
}

function Monitor-Services {
    Write-Header "MONITORING SERVICES"
    Write-ColorText "Press Ctrl+C to stop all services and exit" "Yellow"
    Write-ColorText "Use '.\stop-dev.ps1' to gracefully stop services" "Cyan"
    Write-Host ""
    
    $iteration = 0
    try {
        while ($true) {
            $iteration++
            Write-ColorText "[$($iteration.ToString().PadLeft(3))] $(Get-Date -Format 'HH:mm:ss') - Health Check..." "Gray"
            
            $backendOK = Test-Port -Port $BackendPort -ServiceName "Backend"
            $frontendOK = Test-Port -Port $FrontendPort -ServiceName "Frontend"
            
            if (-not $backendOK -or -not $frontendOK) {
                Write-ColorText "[WARNING] Service issue detected!" "Red"
                Show-HealthStatus
            }
            
            Start-Sleep -Seconds 30  # Check every 30 seconds
        }
    } catch {
        Write-ColorText "Monitoring stopped by user" "Yellow"
    }
}

# Cleanup function for graceful shutdown
function Stop-AllServices {
    Write-ColorText "[INFO] Stopping all services..." "Yellow"
    
    if ($Global:BackendJob) {
        Write-ColorText "  Stopping backend job..." "Gray"
        Stop-Job $Global:BackendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:BackendJob -ErrorAction SilentlyContinue
    }
    
    if ($Global:FrontendJob) {
        Write-ColorText "  Stopping frontend job..." "Gray"
        Stop-Job $Global:FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:FrontendJob -ErrorAction SilentlyContinue
    }
    
    # Remove job tracker file
    if (Test-Path $Global:JobTrackerFile) {
        Remove-Item $Global:JobTrackerFile -ErrorAction SilentlyContinue
    }
    
    Write-ColorText "Coffee Machine Development Environment stopped" "Green"
}

# Register cleanup function for script exit
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-AllServices
}

# Main script execution
try {
    Show-SystemInfo
    
    if ($HealthOnly) {
        Show-HealthStatus
        Show-URLs
        exit 0
    }
    
    # Clean up any existing jobs first
    Cleanup-ExistingJobs
    
    Install-Dependencies
    Initialize-Database
    
    if ($ShowLogs) {
        # In debug mode, start frontend in background first, then backend in foreground
        Write-ColorText "[INFO] Debug mode: Starting frontend in background..." "Yellow"
        
        if (-not (Test-Path "frontend")) {
            Write-ColorText "[ERROR] Frontend directory not found" "Red"
            exit 1
        }
        
        # Start frontend job
        $Global:FrontendJob = Start-Job -Name "CoffeeFrontend" -ScriptBlock {
            param($Port, $WorkingDir)
            Set-Location $WorkingDir
            Push-Location "frontend"
            $env:PORT = $Port
            $env:BROWSER = "none"
            npm start
            Pop-Location
        } -ArgumentList $FrontendPort, $PWD
        
        Write-ColorText "Frontend starting in background..." "Blue"
        Start-Sleep -Seconds 3
        
        Write-Host ""
        Write-ColorText "Frontend will be available at: http://localhost:$FrontendPort" "Cyan"
        Write-ColorText "Backend logs will be shown below in real-time:" "Cyan"
        Write-ColorText "Look for: 'MACHINE API CALL DETECTED:' for machine communication" "Green"
        Write-Host ""
        
        # Start backend in foreground (this will block and show logs)
        Start-Backend
    } else {
        # Normal mode: both services in background
        $Global:BackendJob = Start-Backend
        $Global:FrontendJob = Start-Frontend
        
        # Save job tracking info
        Save-JobTracker
        
        Write-Host ""
        Show-HealthStatus
        Show-URLs
        
        Monitor-Services
    }
    
} catch {
    Write-ColorText "[ERROR] Error occurred: $($_.Exception.Message)" "Red"
    Stop-AllServices
    exit 1
}
