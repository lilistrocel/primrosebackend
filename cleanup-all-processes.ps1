# Comprehensive Process Cleanup Script
# Stops all coffee machine related processes and clears caches

param(
    [switch]$Force,
    [switch]$ClearCache
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

function Stop-AllNodeProcesses {
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

function Stop-AllNPMProcesses {
    Write-ColorText "Stopping all npm processes..." "Blue"
    
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

function Stop-AllReactProcesses {
    Write-ColorText "Stopping all React development processes..." "Blue"
    
    try {
        # Look for processes that might be running React dev server
        $allProcesses = Get-Process -ErrorAction SilentlyContinue | Where-Object {
            $_.ProcessName -eq "node" -and 
            ($_.CommandLine -like "*react-scripts*" -or 
             $_.CommandLine -like "*webpack*" -or
             $_.CommandLine -like "*start*")
        }
        
        if ($allProcesses) {
            foreach ($process in $allProcesses) {
                Write-ColorText "  Stopping React process (PID: $($process.Id))..." "Gray"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-ColorText "  No React processes found" "Gray"
        }
    } catch {
        Write-ColorText "  [ERROR] Failed to stop React processes: $($_.Exception.Message)" "Red"
    }
}

function Stop-AllPortProcesses {
    Write-ColorText "Stopping all processes on development ports..." "Blue"
    
    $ports = @(3000, 3001, 3002, 8080, 8000)
    
    foreach ($port in $ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connections) {
                foreach ($connection in $connections) {
                    $processId = $connection.OwningProcess
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-ColorText "  Stopping process on port $port (PID: $processId)..." "Gray"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } catch {
            Write-ColorText "  [WARNING] Could not check port $port" "Yellow"
        }
    }
}

function Cleanup-JobObjects {
    Write-ColorText "Cleaning up PowerShell job objects..." "Blue"
    
    try {
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

function Clear-FrontendCache {
    Write-ColorText "Clearing frontend cache..." "Blue"
    
    try {
        if (Test-Path "frontend/node_modules") {
            Write-ColorText "  Removing node_modules..." "Gray"
            Remove-Item "frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "frontend/build") {
            Write-ColorText "  Removing build directory..." "Gray"
            Remove-Item "frontend/build" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "frontend/.cache") {
            Write-ColorText "  Removing .cache directory..." "Gray"
            Remove-Item "frontend/.cache" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Clear npm cache
        Write-ColorText "  Clearing npm cache..." "Gray"
        npm cache clean --force 2>$null
        
        Write-ColorText "  [OK] Frontend cache cleared" "Green"
    } catch {
        Write-ColorText "  [ERROR] Failed to clear frontend cache: $($_.Exception.Message)" "Red"
    }
}

function Clear-BackendCache {
    Write-ColorText "Clearing backend cache..." "Blue"
    
    try {
        if (Test-Path "node_modules") {
            Write-ColorText "  Removing node_modules..." "Gray"
            Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Clear npm cache
        Write-ColorText "  Clearing npm cache..." "Gray"
        npm cache clean --force 2>$null
        
        Write-ColorText "  [OK] Backend cache cleared" "Green"
    } catch {
        Write-ColorText "  [ERROR] Failed to clear backend cache: $($_.Exception.Message)" "Red"
    }
}

function Show-RunningProcesses {
    Write-Header "CHECKING REMAINING PROCESSES"
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
    
    Write-ColorText "Node.js processes: $($nodeProcesses.Count)" "White"
    if ($nodeProcesses) {
        foreach ($process in $nodeProcesses) {
            Write-ColorText "  PID: $($process.Id) - $($process.ProcessName)" "Gray"
        }
    }
    
    Write-ColorText "npm processes: $($npmProcesses.Count)" "White"
    if ($npmProcesses) {
        foreach ($process in $npmProcesses) {
            Write-ColorText "  PID: $($process.Id) - $($process.ProcessName)" "Gray"
        }
    }
    
    # Check ports
    $ports = @(3000, 3001, 3002)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            Write-ColorText "Port $port is still in use" "Red"
        } else {
            Write-ColorText "Port $port is free" "Green"
        }
    }
}

# Main execution
try {
    Write-Header "COMPREHENSIVE PROCESS CLEANUP"
    
    if ($Force) {
        Write-ColorText "[WARNING] Force mode enabled - all processes will be killed immediately" "Yellow"
    }
    
    if ($ClearCache) {
        Write-ColorText "[INFO] Cache clearing enabled" "Yellow"
    }
    
    # Stop all processes
    Stop-AllNodeProcesses
    Stop-AllNPMProcesses
    Stop-AllReactProcesses
    Stop-AllPortProcesses
    Cleanup-JobObjects
    
    # Clear caches if requested
    if ($ClearCache) {
        Clear-FrontendCache
        Clear-BackendCache
    }
    
    # Wait for processes to fully stop
    Start-Sleep -Seconds 3
    
    # Show final status
    Show-RunningProcesses
    
    Write-Host ""
    Write-ColorText "[SUCCESS] Cleanup completed" "Green"
    
    if ($ClearCache) {
        Write-ColorText "All caches have been cleared - you may need to run 'npm install' again" "Yellow"
    }
    
} catch {
    Write-ColorText "[ERROR] Error occurred during cleanup: $($_.Exception.Message)" "Red"
    exit 1
}
