# Coffee Machine Development Stop Script
# Gracefully stops backend and frontend services
#
# Usage:
#   .\stop-dev.ps1                    # Stop all services
#   .\stop-dev.ps1 -Force             # Force kill all processes
#   .\stop-dev.ps1 -BackendOnly       # Stop only backend
#   .\stop-dev.ps1 -FrontendOnly      # Stop only frontend

param(
    [switch]$Force,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
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

function Stop-ServiceByPort {
    param($Port, $ServiceName)
    
    Write-ColorText "Stopping $ServiceName on port $Port..." "Blue"
    
    try {
        # Find processes using the port
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($connection in $connections) {
                $processId = $connection.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-ColorText "  Found process: $($process.ProcessName) (PID: $processId)" "Gray"
                    
                    if ($Force) {
                        Write-ColorText "  Force killing process..." "Yellow"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    } else {
                        Write-ColorText "  Gracefully stopping process..." "Green"
                        # Try graceful shutdown first
                        if ($process.ProcessName -eq "node") {
                            # Send SIGTERM equivalent for Node.js
                            $process.CloseMainWindow()
                            Start-Sleep -Seconds 2
                            if (!$process.HasExited) {
                                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                            }
                        } else {
                            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        }
                    }
                }
            }
        } else {
            Write-ColorText "  No processes found on port $Port" "Gray"
        }
        
        # Wait for port to be released
        $attempts = 0
        $maxAttempts = 10
        do {
            Start-Sleep -Seconds 1
            $attempts++
            $stillInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($stillInUse) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        } while ($stillInUse -and $attempts -lt $maxAttempts)
        
        Write-Host ""
        
        if ($attempts -ge $maxAttempts) {
            Write-ColorText "  [WARNING] Port $Port may still be in use" "Yellow"
            return $false
        } else {
            Write-ColorText "  [OK] $ServiceName stopped successfully" "Green"
            return $true
        }
        
    } catch {
        Write-ColorText "  [ERROR] Failed to stop $ServiceName : $($_.Exception.Message)" "Red"
        return $false
    }
}

function Stop-NodeProcesses {
    Write-ColorText "Stopping all Node.js processes..." "Blue"
    
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            foreach ($process in $nodeProcesses) {
                Write-ColorText "  Stopping Node.js process (PID: $($process.Id))..." "Gray"
                if ($Force) {
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                } else {
                    $process.CloseMainWindow()
                    Start-Sleep -Seconds 2
                    if (!$process.HasExited) {
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } else {
            Write-ColorText "  No Node.js processes found" "Gray"
        }
    } catch {
        Write-ColorText "  [ERROR] Failed to stop Node.js processes: $($_.Exception.Message)" "Red"
    }
}

function Stop-NPMProcesses {
    Write-ColorText "Stopping npm processes..." "Blue"
    
    try {
        $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
        if ($npmProcesses) {
            foreach ($process in $npmProcesses) {
                Write-ColorText "  Stopping npm process (PID: $($process.Id))..." "Gray"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-ColorText "  No npm processes found" "Gray"
        }
    } catch {
        Write-ColorText "  [ERROR] Failed to stop npm processes: $($_.Exception.Message)" "Red"
    }
}

function Cleanup-JobObjects {
    Write-ColorText "Cleaning up PowerShell job objects..." "Blue"
    
    try {
        # Get all jobs and stop them
        $jobs = Get-Job -ErrorAction SilentlyContinue
        if ($jobs) {
            foreach ($job in $jobs) {
                Write-ColorText "  Stopping job: $($job.Name) (ID: $($job.Id))" "Gray"
                Stop-Job $job -ErrorAction SilentlyContinue
                Remove-Job $job -ErrorAction SilentlyContinue
            }
        } else {
            Write-ColorText "  No job objects found" "Gray"
        }
    } catch {
        Write-ColorText "  [ERROR] Failed to cleanup job objects: $($_.Exception.Message)" "Red"
    }
}

function Show-RunningServices {
    Write-Header "CHECKING RUNNING SERVICES"
    
    $backendRunning = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    $frontendRunning = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    
    Write-ColorText "Backend (Port $BackendPort): " -NoNewline
    if ($backendRunning) {
        Write-ColorText "RUNNING" "Red"
    } else {
        Write-ColorText "STOPPED" "Green"
    }
    
    Write-ColorText "Frontend (Port $FrontendPort): " -NoNewline
    if ($frontendRunning) {
        Write-ColorText "RUNNING" "Red"
    } else {
        Write-ColorText "STOPPED" "Green"
    }
    
    # Check for any Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-ColorText "Node.js processes still running: $($nodeProcesses.Count)" "Yellow"
        foreach ($process in $nodeProcesses) {
            Write-ColorText "  PID: $($process.Id) - $($process.ProcessName)" "Gray"
        }
    } else {
        Write-ColorText "No Node.js processes running" "Green"
    }
}

# Main script execution
try {
    Write-Header "STOPPING COFFEE MACHINE DEVELOPMENT SERVICES"
    
    if ($Force) {
        Write-ColorText "[WARNING] Force mode enabled - processes will be killed immediately" "Yellow"
    }
    
    # Stop services based on parameters
    if (-not $FrontendOnly) {
        Stop-ServiceByPort -Port $BackendPort -ServiceName "Backend"
    }
    
    if (-not $BackendOnly) {
        Stop-ServiceByPort -Port $FrontendPort -ServiceName "Frontend"
    }
    
    # Additional cleanup
    if ($Force) {
        Stop-NodeProcesses
        Stop-NPMProcesses
    }
    
    Cleanup-JobObjects
    
    # Wait a moment for processes to fully stop
    Start-Sleep -Seconds 2
    
    # Show final status
    Show-RunningServices
    
    Write-Host ""
    Write-ColorText "[SUCCESS] Coffee Machine Development Environment stopped" "Green"
    
    if ($Force) {
        Write-ColorText "All processes have been forcefully terminated" "Yellow"
    } else {
        Write-ColorText "Services have been gracefully stopped" "Green"
    }
    
} catch {
    Write-ColorText "[ERROR] Error occurred during shutdown: $($_.Exception.Message)" "Red"
    exit 1
}
