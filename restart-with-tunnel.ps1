#!/usr/bin/env pwsh
# restart-with-tunnel.ps1
# Restart all services with tunnel support enabled

Write-Host "🌐 Restarting Services with Tunnel Support" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all services
Write-Host "1️⃣ Stopping all services..." -ForegroundColor Yellow
pm2 stop all 2>$null
pm2 delete all 2>$null
Write-Host "   ✅ All services stopped" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 2: Verify environment variables
Write-Host ""
Write-Host "2️⃣ Verifying environment configuration..." -ForegroundColor Yellow

# Check root .env
$rootEnvContent = Get-Content ".env" -Raw
if ($rootEnvContent -match "ENABLE_TUNNEL=true") {
    Write-Host "   ✅ Root .env: ENABLE_TUNNEL=true" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Root .env: ENABLE_TUNNEL not set to true" -ForegroundColor Red
}

# Check frontend .env
$frontendEnvContent = Get-Content "frontend\.env" -Raw
if ($frontendEnvContent -match "REACT_APP_API_BASE_URL=auto") {
    Write-Host "   ✅ Frontend .env: REACT_APP_API_BASE_URL=auto" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend .env: REACT_APP_API_BASE_URL not set to auto" -ForegroundColor Red
}

# Step 3: Rebuild frontend
Write-Host ""
Write-Host "3️⃣ Rebuilding frontend with new configuration..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

Push-Location frontend
try {
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 Installing dependencies first..." -ForegroundColor Yellow
        npm install
    }
    
    # Build frontend
    Write-Host "   🔨 Building frontend..." -ForegroundColor Yellow
    $env:GENERATE_SOURCEMAP = "false"
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} catch {
    Write-Host "   ❌ Error building frontend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 4: Start backend
Write-Host ""
Write-Host "4️⃣ Starting backend server..." -ForegroundColor Yellow
pm2 start ecosystem.config.js --only backend
Start-Sleep -Seconds 3

$backendStatus = pm2 list | Select-String "backend.*online"
if ($backendStatus) {
    Write-Host "   ✅ Backend started successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend may not have started correctly" -ForegroundColor Red
}

# Step 5: Start frontend
Write-Host ""
Write-Host "5️⃣ Starting frontend server..." -ForegroundColor Yellow
pm2 start ecosystem.config.js --only frontend
Start-Sleep -Seconds 3

$frontendStatus = pm2 list | Select-String "frontend.*online"
if ($frontendStatus) {
    Write-Host "   ✅ Frontend started successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend may not have started correctly" -ForegroundColor Red
}

# Step 6: Check tunnel
Write-Host ""
Write-Host "6️⃣ Checking Cloudflare tunnel..." -ForegroundColor Yellow

$tunnelProcess = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   ✅ Cloudflare tunnel is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cloudflare tunnel not detected" -ForegroundColor Yellow
    Write-Host "   Starting tunnel..." -ForegroundColor Yellow
    
    # Check if we have the tunnel config
    if (Test-Path "cloudflare-tunnel-config.yml") {
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --config cloudflare-tunnel-config.yml run" -WindowStyle Minimized
        Start-Sleep -Seconds 3
        Write-Host "   ✅ Tunnel started" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Tunnel config not found!" -ForegroundColor Red
    }
}

# Step 7: Display service status
Write-Host ""
Write-Host "7️⃣ Service Status:" -ForegroundColor Yellow
pm2 list

# Step 8: Test connectivity
Write-Host ""
Write-Host "8️⃣ Testing API connectivity..." -ForegroundColor Yellow

# Test local backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Local backend responding" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Local backend not responding" -ForegroundColor Red
}

# Test local frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Local frontend responding" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Local frontend not responding" -ForegroundColor Red
}

# Test tunnel backend
Write-Host "   Testing tunnel backend..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://coffee-api.hydromods.org/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Tunnel backend responding" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Tunnel backend not responding (may take a moment to start)" -ForegroundColor Yellow
}

# Test tunnel frontend
Write-Host "   Testing tunnel frontend..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://k2.hydromods.org" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Tunnel frontend responding" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Tunnel frontend not responding (may take a moment to start)" -ForegroundColor Yellow
}

# Final summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Restart Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Local Frontend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Local Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "   Tunnel Frontend: https://k2.hydromods.org" -ForegroundColor White
Write-Host "   Tunnel Backend:  https://coffee-api.hydromods.org" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Test Kiosk:" -ForegroundColor Cyan
Write-Host "   Local:  http://localhost:3001/kiosk" -ForegroundColor White
Write-Host "   Tunnel: https://k2.hydromods.org/kiosk" -ForegroundColor White
Write-Host ""
Write-Host "📊 View Logs:" -ForegroundColor Cyan
Write-Host "   pm2 logs backend" -ForegroundColor White
Write-Host "   pm2 logs frontend" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Manage Services:" -ForegroundColor Cyan
Write-Host "   pm2 list          # View all services" -ForegroundColor White
Write-Host "   pm2 restart all   # Restart all services" -ForegroundColor White
Write-Host "   pm2 stop all      # Stop all services" -ForegroundColor White
Write-Host ""
Write-Host "✅ The kiosk should now work through the tunnel!" -ForegroundColor Green
Write-Host ""

