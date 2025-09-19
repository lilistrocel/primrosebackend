# K2 Coffee Machine with Internet Tunnel
param(
    [string]$TunnelService = "ngrok",
    [string]$BackendSubdomain = "k2-coffee-backend",
    [string]$FrontendSubdomain = "k2-coffee-kiosk",
    [switch]$SkipInstall
)

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🌐 K2 COFFEE MACHINE - INTERNET TUNNEL SETUP" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
$missingDeps = @()

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    $missingDeps += "Node.js"
    Write-Host "❌ Node.js not found" -ForegroundColor Red
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} catch {
    $missingDeps += "npm"
    Write-Host "❌ npm not found" -ForegroundColor Red
}

# Check tunnel service
switch ($TunnelService) {
    "ngrok" {
        try {
            $ngrokVersion = ngrok version 2>$null
            Write-Host "✅ Ngrok: Available" -ForegroundColor Green
        } catch {
            $missingDeps += "ngrok"
            Write-Host "❌ Ngrok not found - Download from https://ngrok.com/download" -ForegroundColor Red
        }
    }
    "localtunnel" {
        try {
            $ltVersion = lt --version 2>$null
            Write-Host "✅ LocalTunnel: Available" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  LocalTunnel not found - Installing..." -ForegroundColor Yellow
            try {
                npm install -g localtunnel
                Write-Host "✅ LocalTunnel installed" -ForegroundColor Green
            } catch {
                $missingDeps += "localtunnel"
                Write-Host "❌ Failed to install LocalTunnel" -ForegroundColor Red
            }
        }
    }
    "cloudflare" {
        try {
            $cfVersion = cloudflared version 2>$null
            Write-Host "✅ Cloudflared: Available" -ForegroundColor Green
        } catch {
            $missingDeps += "cloudflared"
            Write-Host "❌ Cloudflared not found - Download from https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Red
        }
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Red
    Write-Host "Please install missing dependencies and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🚀 STARTING SERVICES" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Install dependencies if needed
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    
    # Backend dependencies
    if (Test-Path "package.json") {
        Write-Host "Installing backend dependencies..." -ForegroundColor Blue
        npm install | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
            exit 1
        }
    }
    
    # Frontend dependencies
    if (Test-Path "frontend/package.json") {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
        Set-Location frontend
        npm install | Out-Null
        Set-Location ..
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
            exit 1
        }
    }
}

# Initialize database
Write-Host ""
Write-Host "🗄️  Initializing database..." -ForegroundColor Yellow
try {
    npm run init-db | Out-Null
    Write-Host "✅ Database initialized" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database initialization failed - continuing..." -ForegroundColor Yellow
}

# Start Backend
Write-Host ""
Write-Host "🚀 Starting Backend Server (Port 3000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location $workingDir
    npm start
} -ArgumentList $PWD

Start-Sleep 3

# Check if backend started
$backendCheck = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is running on port 3000" -ForegroundColor Green
            $backendCheck = $true
            break
        }
    } catch {
        Write-Host "⏳ Waiting for backend... ($i/10)" -ForegroundColor Blue
        Start-Sleep 2
    }
}

if (-not $backendCheck) {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Stop-Job $backendJob -Force
    exit 1
}

# Start Frontend
Write-Host ""
Write-Host "🎨 Starting Frontend Application (Port 3001)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location "$workingDir/frontend"
    npm start
} -ArgumentList $PWD

Start-Sleep 5

# Check if frontend started
$frontendCheck = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is running on port 3001" -ForegroundColor Green
            $frontendCheck = $true
            break
        }
    } catch {
        Write-Host "⏳ Waiting for frontend... ($i/15)" -ForegroundColor Blue
        Start-Sleep 2
    }
}

if (-not $frontendCheck) {
    Write-Host "⚠️  Frontend might still be starting - continuing with tunnels..." -ForegroundColor Yellow
}

# Start Tunnels
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🌐 CREATING INTERNET TUNNELS" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backendUrl = ""
$frontendUrl = ""

switch ($TunnelService) {
    "ngrok" {
        Write-Host "🔄 Using Ngrok tunnels..." -ForegroundColor Blue
        
        # Start backend tunnel
        Write-Host "Starting backend tunnel..." -ForegroundColor Yellow
        $backendTunnelJob = Start-Job -ScriptBlock {
            param($subdomain)
            if ($subdomain) {
                ngrok http 3000 --subdomain=$subdomain
            } else {
                ngrok http 3000
            }
        } -ArgumentList $BackendSubdomain
        
        # Start frontend tunnel
        Write-Host "Starting frontend tunnel..." -ForegroundColor Yellow
        $frontendTunnelJob = Start-Job -ScriptBlock {
            param($subdomain)
            if ($subdomain) {
                ngrok http 3001 --subdomain=$subdomain
            } else {
                ngrok http 3001
            }
        } -ArgumentList $FrontendSubdomain
        
        Start-Sleep 5
        
        if ($BackendSubdomain) {
            $backendUrl = "https://$BackendSubdomain.ngrok.io"
            $frontendUrl = "https://$FrontendSubdomain.ngrok.io"
        } else {
            Write-Host "⚠️  Custom subdomains not set - check ngrok dashboard for URLs" -ForegroundColor Yellow
            $backendUrl = "https://[check-ngrok-dashboard].ngrok.io"
            $frontendUrl = "https://[check-ngrok-dashboard].ngrok.io"
        }
    }
    
    "localtunnel" {
        Write-Host "🔄 Using LocalTunnel..." -ForegroundColor Blue
        
        # Start backend tunnel
        $backendTunnelJob = Start-Job -ScriptBlock {
            param($subdomain)
            lt --port 3000 --subdomain $subdomain
        } -ArgumentList $BackendSubdomain
        
        # Start frontend tunnel
        $frontendTunnelJob = Start-Job -ScriptBlock {
            param($subdomain)
            lt --port 3001 --subdomain $subdomain
        } -ArgumentList $FrontendSubdomain
        
        Start-Sleep 3
        
        $backendUrl = "https://$BackendSubdomain.loca.lt"
        $frontendUrl = "https://$FrontendSubdomain.loca.lt"
    }
    
    "cloudflare" {
        Write-Host "🔄 Using Cloudflare Tunnel..." -ForegroundColor Blue
        Write-Host "⚠️  Make sure you have configured cloudflared and created a tunnel named 'k2-coffee'" -ForegroundColor Yellow
        
        $tunnelJob = Start-Job -ScriptBlock {
            cloudflared tunnel run k2-coffee
        }
        
        $backendUrl = "https://[your-configured-domain].com"
        $frontendUrl = "https://[your-configured-domain].com"
    }
}

# Display results
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ K2 COFFEE MACHINE IS NOW ONLINE!" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Your Internet URLs:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🖥️  Management Interface:" -ForegroundColor White
Write-Host "   $frontendUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚙️  API Endpoint:" -ForegroundColor White
Write-Host "   $backendUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ☕ Coffee Machine URL:" -ForegroundColor White
Write-Host "   $backendUrl/api/motong/" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    📱 MOBILE ACCESS" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Kiosk URL (for tablets/phones):" -ForegroundColor White
Write-Host "$frontendUrl/kiosk" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Item Management:" -ForegroundColor White
Write-Host "$frontendUrl/items" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Order Monitor:" -ForegroundColor White
Write-Host "$frontendUrl/orders" -ForegroundColor Green
Write-Host ""

# Show QR codes
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    📱 QR CODES" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Kiosk QR Code:" -ForegroundColor White
Write-Host "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$([uri]::EscapeDataString("$frontendUrl/kiosk"))" -ForegroundColor Green
Write-Host ""
Write-Host "⚙️  Management QR Code:" -ForegroundColor White
Write-Host "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$([uri]::EscapeDataString($frontendUrl))" -ForegroundColor Green
Write-Host ""

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "    🛑 PRESS ANY KEY TO STOP ALL SERVICES" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""
Write-Host "All services are running. Press any key to stop..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host ""
Write-Host "🛑 Stopping all services..." -ForegroundColor Red

# Stop all jobs
if ($backendJob) { Stop-Job $backendJob -Force; Remove-Job $backendJob -Force }
if ($frontendJob) { Stop-Job $frontendJob -Force; Remove-Job $frontendJob -Force }
if ($backendTunnelJob) { Stop-Job $backendTunnelJob -Force; Remove-Job $backendTunnelJob -Force }
if ($frontendTunnelJob) { Stop-Job $frontendTunnelJob -Force; Remove-Job $frontendTunnelJob -Force }
if ($tunnelJob) { Stop-Job $tunnelJob -Force; Remove-Job $tunnelJob -Force }

# Kill any remaining processes
try {
    Get-Process | Where-Object {
        $_.ProcessName -eq "node" -or 
        $_.ProcessName -eq "ngrok" -or 
        $_.ProcessName -eq "cloudflared" -or
        $_.ProcessName -eq "lt"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
    # Ignore errors
}

Write-Host "✅ All services stopped." -ForegroundColor Green
Write-Host ""
Write-Host "Thanks for using K2 Coffee Machine! ☕" -ForegroundColor Cyan
