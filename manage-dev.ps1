# Coffee Machine Development Service Manager
# Unified script for starting, stopping, and managing development services
#
# Usage:
#   .\manage-dev.ps1 start                    # Start all services
#   .\manage-dev.ps1 stop                     # Stop all services
#   .\manage-dev.ps1 restart                  # Restart all services
#   .\manage-dev.ps1 status                   # Check service status
#   .\manage-dev.ps1 logs                     # View service logs
#   .\manage-dev.ps1 health                   # Run health check
#   .\manage-dev.ps1 clean                    # Clean up all processes

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "health", "clean")]
    [string]$Action = "status",
    
    [switch]$Force,
    [switch]$ShowLogs,
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

function Get-ServiceStatus {
    $backendRunning = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    $frontendRunning = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
    
    return @{
        BackendRunning = $backendRunning -ne $null
        FrontendRunning = $frontendRunning -ne $null
        NodeProcesses = $nodeProcesses.Count
        NPMProcesses = $npmProcesses.Count
        BackendPort = $BackendPort
        FrontendPort = $FrontendPort
    }
}

function Show-ServiceStatus {
    Write-Header "SERVICE STATUS"
    
    $status = Get-ServiceStatus
    
    Write-ColorText "Backend (Port $($status.BackendPort)): " -NoNewline
    if ($status.BackendRunning) {
        Write-ColorText "RUNNING" "Green"
    } else {
        Write-ColorText "STOPPED" "Red"
    }
    
    Write-ColorText "Frontend (Port $($status.FrontendPort)): " -NoNewline
    if ($status.FrontendRunning) {
        Write-ColorText "RUNNING" "Green"
    } else {
        Write-ColorText "STOPPED" "Red"
    }
    
    Write-ColorText "Node.js Processes: $($status.NodeProcesses)" "Gray"
    Write-ColorText "NPM Processes: $($status.NPMProcesses)" "Gray"
    
    # Show process details if any are running
    if ($status.NodeProcesses -gt 0) {
        Write-ColorText "`nNode.js Process Details:" "Yellow"
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        foreach ($process in $nodeProcesses) {
            Write-ColorText "  PID: $($process.Id) - $($process.ProcessName) - Started: $($process.StartTime)" "Gray"
        }
    }
    
    return $status
}

function Test-ServiceHealth {
    Write-Header "HEALTH CHECK"
    
    $status = Get-ServiceStatus
    
    if ($status.BackendRunning) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$BackendPort/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.status -eq "OK") {
                Write-ColorText "[OK] Backend health check: OK" "Green"
                Write-ColorText "   Service: $($response.service)" "Gray"
                Write-ColorText "   Database: $($response.database)" "Gray"
            } else {
                Write-ColorText "[WARNING] Backend health check: $($response.status)" "Yellow"
            }
        } catch {
            Write-ColorText "[ERROR] Backend health check failed: $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorText "[ERROR] Backend is not running" "Red"
    }
    
    if ($status.FrontendRunning) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-ColorText "[OK] Frontend is serving correctly" "Green"
            } else {
                Write-ColorText "[WARNING] Frontend returned status: $($response.StatusCode)" "Yellow"
            }
        } catch {
            Write-ColorText "[ERROR] Frontend health check failed: $($_.Exception.Message)" "Red"
        }
    } else {
        Write-ColorText "[ERROR] Frontend is not running" "Red"
    }
    
    # Overall health assessment
    Write-Host ""
    if ($status.BackendRunning -and $status.FrontendRunning) {
        Write-ColorText "[SUCCESS] ALL SYSTEMS OPERATIONAL" "Green"
    } elseif ($status.BackendRunning) {
        Write-ColorText "[WARNING] BACKEND ONLY RUNNING" "Yellow"
    } elseif ($status.FrontendRunning) {
        Write-ColorText "[WARNING] FRONTEND ONLY RUNNING" "Yellow"
    } else {
        Write-ColorText "[ERROR] SYSTEM DOWN" "Red"
    }
}

function Start-Services {
    Write-Header "STARTING SERVICES"
    
    $status = Get-ServiceStatus
    
    if ($status.BackendRunning -and $status.FrontendRunning) {
        Write-ColorText "[INFO] Services are already running" "Yellow"
        Show-ServiceStatus
        return
    }
    
    if ($status.BackendRunning) {
        Write-ColorText "[INFO] Backend is already running" "Yellow"
    } else {
        Write-ColorText "Starting backend..." "Blue"
        if ($ShowLogs) {
            & "$PSScriptRoot\start-dev-improved.ps1" -ShowLogs -SkipInstall:$SkipInstall
        } else {
            & "$PSScriptRoot\start-dev-improved.ps1" -SkipInstall:$SkipInstall
        }
    }
}

function Stop-Services {
    Write-Header "STOPPING SERVICES"
    
    $status = Get-ServiceStatus
    
    if (-not $status.BackendRunning -and -not $status.FrontendRunning) {
        Write-ColorText "[INFO] No services are running" "Yellow"
        return
    }
    
    Write-ColorText "Stopping all development services..." "Blue"
    & "$PSScriptRoot\stop-dev.ps1" -Force:$Force
}

function Restart-Services {
    Write-Header "RESTARTING SERVICES"
    
    Write-ColorText "Stopping services..." "Blue"
    Stop-Services
    
    Start-Sleep -Seconds 3
    
    Write-ColorText "Starting services..." "Blue"
    Start-Services
}

function Show-ServiceLogs {
    Write-Header "SERVICE LOGS"
    
    $status = Get-ServiceStatus
    
    if ($status.BackendRunning) {
        Write-ColorText "Backend is running on port $BackendPort" "Green"
        Write-ColorText "Health check: http://localhost:$BackendPort/health" "Cyan"
    } else {
        Write-ColorText "Backend is not running" "Red"
    }
    
    if ($status.FrontendRunning) {
        Write-ColorText "Frontend is running on port $FrontendPort" "Green"
        Write-ColorText "Management UI: http://localhost:$FrontendPort" "Cyan"
    } else {
        Write-ColorText "Frontend is not running" "Red"
    }
    
    # Show recent log files if they exist
    $logFiles = @("backend.log", "frontend.log", "tunnel.log")
    foreach ($logFile in $logFiles) {
        if (Test-Path $logFile) {
            Write-ColorText "`n--- $logFile (last 10 lines) ---" "Yellow"
            Get-Content $logFile -Tail 10 -ErrorAction SilentlyContinue
        }
    }
}

function Clean-AllProcesses {
    Write-Header "CLEANING ALL PROCESSES"
    
    Write-ColorText "This will forcefully stop ALL Node.js and npm processes!" "Red"
    Write-ColorText "This may affect other Node.js applications running on your system." "Yellow"
    
    if (-not $Force) {
        $confirm = Read-Host "Are you sure you want to continue? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-ColorText "Operation cancelled" "Yellow"
            return
        }
    }
    
    # Stop all Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-ColorText "Stopping $($nodeProcesses.Count) Node.js process(es)..." "Blue"
        foreach ($process in $nodeProcesses) {
            Write-ColorText "  Stopping PID: $($process.Id)" "Gray"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop all npm processes
    $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
    if ($npmProcesses) {
        Write-ColorText "Stopping $($npmProcesses.Count) npm process(es)..." "Blue"
        foreach ($process in $npmProcesses) {
            Write-ColorText "  Stopping PID: $($process.Id)" "Gray"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Clean up PowerShell jobs
    $jobs = Get-Job -ErrorAction SilentlyContinue
    if ($jobs) {
        Write-ColorText "Cleaning up $($jobs.Count) PowerShell job(s)..." "Blue"
        foreach ($job in $jobs) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
        }
    }
    
    # Remove job tracker file
    $jobTrackerFile = "$PSScriptRoot\.dev-jobs.json"
    if (Test-Path $jobTrackerFile) {
        Remove-Item $jobTrackerFile -ErrorAction SilentlyContinue
        Write-ColorText "Removed job tracker file" "Gray"
    }
    
    Write-ColorText "[SUCCESS] All processes cleaned up" "Green"
}

function Show-Usage {
    Write-Header "COFFEE MACHINE SERVICE MANAGER"
    Write-ColorText "Usage: .\manage-dev.ps1 [action] [options]" "White"
    Write-Host ""
    Write-ColorText "Actions:" "Yellow"
    Write-ColorText "  start     - Start all development services" "White"
    Write-ColorText "  stop      - Stop all development services" "White"
    Write-ColorText "  restart   - Restart all development services" "White"
    Write-ColorText "  status    - Show current service status" "White"
    Write-ColorText "  logs      - Show service logs and URLs" "White"
    Write-ColorText "  health    - Run comprehensive health check" "White"
    Write-ColorText "  clean     - Force stop all Node.js processes" "White"
    Write-Host ""
    Write-ColorText "Options:" "Yellow"
    Write-ColorText "  -Force        - Force operations (no confirmation)" "White"
    Write-ColorText "  -ShowLogs     - Show real-time logs when starting" "White"
    Write-ColorText "  -SkipInstall  - Skip dependency installation" "White"
    Write-ColorText "  -BackendPort  - Backend port (default: 3000)" "White"
    Write-ColorText "  -FrontendPort - Frontend port (default: 3001)" "White"
    Write-Host ""
    Write-ColorText "Examples:" "Yellow"
    Write-ColorText "  .\manage-dev.ps1 start -ShowLogs" "White"
    Write-ColorText "  .\manage-dev.ps1 stop -Force" "White"
    Write-ColorText "  .\manage-dev.ps1 status" "White"
    Write-ColorText "  .\manage-dev.ps1 clean -Force" "White"
}

# Main script execution
try {
    switch ($Action.ToLower()) {
        "start" {
            Start-Services
        }
        "stop" {
            Stop-Services
        }
        "restart" {
            Restart-Services
        }
        "status" {
            Show-ServiceStatus
        }
        "logs" {
            Show-ServiceLogs
        }
        "health" {
            Test-ServiceHealth
        }
        "clean" {
            Clean-AllProcesses
        }
        default {
            Show-Usage
        }
    }
} catch {
    Write-ColorText "[ERROR] Error occurred: $($_.Exception.Message)" "Red"
    exit 1
}
