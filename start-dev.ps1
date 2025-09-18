# Coffee Machine Development Startup Script
# Starts backend, frontend, and monitors system health

param(
    [switch]$SkipInstall,
    [switch]$Quiet,
    [switch]$HealthOnly,
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
    Write-ColorText "═══════════════════════════════════════════════════════════" "Cyan"
    Write-ColorText "  $Text" "Yellow"
    Write-ColorText "═══════════════════════════════════════════════════════════" "Cyan"
    Write-Host ""
}

function Test-Port {
    param($Port, $ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-ColorText "✅ $ServiceName is running on port $Port" "Green"
            return $true
        } else {
            Write-ColorText "❌ $ServiceName is not responding on port $Port" "Red"
            return $false
        }
    } catch {
        Write-ColorText "❌ Cannot check $ServiceName on port $Port" "Red"
        return $false
    }
}

function Test-BackendHealth {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$BackendPort/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.status -eq "OK") {
            Write-ColorText "✅ Backend health check: OK" "Green"
            Write-ColorText "   Service: $($response.service)" "Gray"
            Write-ColorText "   Database: $($response.database)" "Gray"
            return $true
        }
    } catch {
        Write-ColorText "❌ Backend health check failed: $($_.Exception.Message)" "Red"
    }
    return $false
}

function Test-FrontendHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorText "✅ Frontend is serving correctly" "Green"
            return $true
        }
    } catch {
        Write-ColorText "❌ Frontend health check failed: $($_.Exception.Message)" "Red"
    }
    return $false
}

function Test-DatabaseConnection {
    try {
        if (Test-Path "coffee_machine.db") {
            Write-ColorText "✅ Database file exists: coffee_machine.db" "Green"
            
            # Test database with a simple query
            $response = Invoke-RestMethod -Uri "http://localhost:$BackendPort/api/motong/deviceOrderQueueList" -Method Post -Body '{"deviceId":"1"}' -ContentType "application/json" -ErrorAction SilentlyContinue
            if ($response.code -eq 0) {
                Write-ColorText "✅ Database query successful" "Green"
                Write-ColorText "   Active orders: $($response.data.Count)" "Gray"
                return $true
            }
        } else {
            Write-ColorText "⚠️  Database file not found - will be created on first run" "Yellow"
        }
    } catch {
        Write-ColorText "❌ Database connection failed: $($_.Exception.Message)" "Red"
    }
    return $false
}

function Show-SystemInfo {
    Write-Header "☕ COFFEE MACHINE DEVELOPMENT ENVIRONMENT"
    Write-ColorText "Node.js Version: $(node --version)" "Green"
    Write-ColorText "NPM Version: $(npm --version)" "Green"
    Write-ColorText "PowerShell Version: $($PSVersionTable.PSVersion)" "Green"
    Write-ColorText "Working Directory: $(Get-Location)" "Green"
    Write-Host ""
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-ColorText "⏭️  Skipping dependency installation" "Yellow"
        return
    }
    
    Write-Header "📦 INSTALLING DEPENDENCIES"
    
    # Backend dependencies
    if (Test-Path "package.json") {
        Write-ColorText "Installing backend dependencies..." "Blue"
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Backend dependencies installed" "Green"
        } else {
            Write-ColorText "❌ Backend dependency installation failed" "Red"
            exit 1
        }
    }
    
    # Frontend dependencies
    if (Test-Path "frontend/package.json") {
        Write-ColorText "Installing frontend dependencies..." "Blue"
        Push-Location "frontend"
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Frontend dependencies installed" "Green"
        } else {
            Write-ColorText "❌ Frontend dependency installation failed" "Red"
            Pop-Location
            exit 1
        }
        Pop-Location
    }
}

function Initialize-Database {
    Write-Header "🗄️  INITIALIZING DATABASE"
    
    if (-not (Test-Path "coffee_machine.db")) {
        Write-ColorText "Creating database with mock data..." "Blue"
        npm run init-db
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Database initialized successfully" "Green"
        } else {
            Write-ColorText "❌ Database initialization failed" "Red"
            exit 1
        }
    } else {
        Write-ColorText "✅ Database already exists" "Green"
    }
}

function Start-Backend {
    Write-Header "🚀 STARTING BACKEND SERVER"
    
    # Kill any existing process on backend port
    $existingProcess = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "⚠️  Port $BackendPort is in use, attempting to free it..." "Yellow"
        Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    Write-ColorText "Starting backend on port $BackendPort..." "Blue"
    
    # Start backend in background
    $backendJob = Start-Job -ScriptBlock {
        param($Port)
        Set-Location $using:PWD
        $env:PORT = $Port
        npm start
    } -ArgumentList $BackendPort
    
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
        Write-ColorText "🔗 Backend URL: http://localhost:$BackendPort" "Cyan"
        Write-ColorText "📊 Health Check: http://localhost:$BackendPort/health" "Cyan"
        Write-ColorText "📡 API Base: http://localhost:$BackendPort/api/motong/" "Cyan"
    } else {
        Write-ColorText "❌ Backend failed to start within $maxAttempts seconds" "Red"
        exit 1
    }
    
    return $backendJob
}

function Start-Frontend {
    Write-Header "🎨 STARTING FRONTEND APPLICATION"
    
    if (-not (Test-Path "frontend")) {
        Write-ColorText "❌ Frontend directory not found" "Red"
        return $null
    }
    
    # Kill any existing process on frontend port
    $existingProcess = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-ColorText "⚠️  Port $FrontendPort is in use, attempting to free it..." "Yellow"
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
        $env:BROWSER = "none"  # Don't auto-open browser
        npm start
        Pop-Location
    } -ArgumentList $FrontendPort
    
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
        Write-ColorText "🌐 Frontend URL: http://localhost:$FrontendPort" "Cyan"
        Write-ColorText "📱 Management Interface: http://localhost:$FrontendPort" "Cyan"
    } else {
        Write-ColorText "❌ Frontend failed to start within $maxAttempts seconds" "Red"
        Write-ColorText "   Check 'npm install' was successful in frontend directory" "Yellow"
    }
    
    return $frontendJob
}

function Show-HealthStatus {
    Write-Header "🏥 SYSTEM HEALTH CHECK"
    
    # Test services
    $backendOK = Test-Port -Port $BackendPort -ServiceName "Backend"
    $frontendOK = Test-Port -Port $FrontendPort -ServiceName "Frontend"
    
    if ($backendOK) {
        Test-BackendHealth
        Test-DatabaseConnection
    }
    
    if ($frontendOK) {
        Test-FrontendHealth
    }
    
    Write-Host ""
    
    # Overall status
    if ($backendOK -and $frontendOK) {
        Write-ColorText "🎉 ALL SYSTEMS OPERATIONAL" "Green"
        Write-ColorText "   Coffee Machine Management System is ready!" "Green"
    } elseif ($backendOK) {
        Write-ColorText "⚠️  BACKEND ONLY RUNNING" "Yellow"
        Write-ColorText "   Coffee machine can connect, but no web interface" "Yellow"
    } elseif ($frontendOK) {
        Write-ColorText "⚠️  FRONTEND ONLY RUNNING" "Yellow"
        Write-ColorText "   Web interface available, but no backend connection" "Yellow"
    } else {
        Write-ColorText "❌ SYSTEM DOWN" "Red"
        Write-ColorText "   Neither backend nor frontend is running" "Red"
    }
}

function Show-URLs {
    Write-Header "🔗 ACCESS POINTS"
    Write-ColorText "Backend Services:" "White"
    Write-ColorText "  🏥 Health Check:    http://localhost:$BackendPort/health" "Cyan"
    Write-ColorText "  📡 API Endpoint:    http://localhost:$BackendPort/api/motong/" "Cyan"
    Write-ColorText "  📊 Server Info:     http://localhost:$BackendPort/" "Cyan"
    Write-Host ""
    Write-ColorText "Frontend Application:" "White"
    Write-ColorText "  🎨 Management UI:   http://localhost:$FrontendPort/" "Cyan"
    Write-ColorText "  📦 Item Manager:    http://localhost:$FrontendPort/items" "Cyan"
    Write-ColorText "  📋 Order Monitor:   http://localhost:$FrontendPort/orders" "Cyan"
    Write-ColorText "  🛠️  Device Status:   http://localhost:$FrontendPort/device" "Cyan"
    Write-Host ""
    Write-ColorText "Coffee Machine Configuration:" "White"
    Write-ColorText "  Change machine URL to: http://localhost:$BackendPort/api/motong/" "Yellow"
}

function Monitor-Services {
    Write-Header "👀 MONITORING SERVICES"
    Write-ColorText "Press Ctrl+C to stop all services and exit" "Yellow"
    Write-Host ""
    
    $iteration = 0
    try {
        while ($true) {
            $iteration++
            Write-ColorText "[$($iteration.ToString().PadLeft(3))] $(Get-Date -Format 'HH:mm:ss') - Health Check..." "Gray"
            
            $backendOK = Test-Port -Port $BackendPort -ServiceName "Backend"
            $frontendOK = Test-Port -Port $FrontendPort -ServiceName "Frontend"
            
            if (-not $backendOK -or -not $frontendOK) {
                Write-ColorText "⚠️  Service issue detected!" "Red"
                Show-HealthStatus
            }
            
            Start-Sleep -Seconds 30  # Check every 30 seconds
        }
    } catch {
        Write-ColorText "Monitoring stopped by user" "Yellow"
    }
}

# Main script execution
try {
    Show-SystemInfo
    
    if ($HealthOnly) {
        Show-HealthStatus
        Show-URLs
        exit 0
    }
    
    Install-Dependencies
    Initialize-Database
    
    $backendJob = Start-Backend
    $frontendJob = Start-Frontend
    
    Write-Host ""
    Show-HealthStatus
    Show-URLs
    
    # Store job info for cleanup
    $Global:BackendJob = $backendJob
    $Global:FrontendJob = $frontendJob
    
    Monitor-Services
    
} catch {
    Write-ColorText "❌ Error occurred: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # Cleanup jobs on exit
    if ($Global:BackendJob) {
        Write-ColorText "🛑 Stopping backend..." "Yellow"
        Stop-Job $Global:BackendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:BackendJob -ErrorAction SilentlyContinue
    }
    
    if ($Global:FrontendJob) {
        Write-ColorText "🛑 Stopping frontend..." "Yellow"
        Stop-Job $Global:FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $Global:FrontendJob -ErrorAction SilentlyContinue
    }
    
    Write-ColorText "Coffee Machine Development Environment stopped" "Green"
}
