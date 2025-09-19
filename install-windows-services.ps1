# Install Coffee Machine Services as Windows Services
# This script sets up both Cloudflare tunnel and Coffee backend as Windows services

Write-Host "☕ Coffee Machine Windows Service Installer" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    exit 1
}

$ProjectRoot = $PSScriptRoot
$NSSMPath = "$ProjectRoot\nssm.exe"

Write-Host "📂 Project Directory: $ProjectRoot" -ForegroundColor Green

# Step 1: Download NSSM if not exists
if (-not (Test-Path $NSSMPath)) {
    Write-Host "📥 Downloading NSSM (Non-Sucking Service Manager)..." -ForegroundColor Cyan
    
    $NSSMUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $TempZip = "$env:TEMP\nssm.zip"
    $TempDir = "$env:TEMP\nssm-extract"
    
    try {
        Invoke-WebRequest -Uri $NSSMUrl -OutFile $TempZip
        Expand-Archive -Path $TempZip -DestinationPath $TempDir -Force
        
        # Copy appropriate NSSM executable (64-bit)
        if ([Environment]::Is64BitOperatingSystem) {
            Copy-Item "$TempDir\nssm-2.24\win64\nssm.exe" $NSSMPath
        } else {
            Copy-Item "$TempDir\nssm-2.24\win32\nssm.exe" $NSSMPath
        }
        
        # Cleanup
        Remove-Item $TempZip -Force
        Remove-Item $TempDir -Recurse -Force
        
        Write-Host "✅ NSSM downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download NSSM: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Find required executables
Write-Host "🔍 Locating required executables..." -ForegroundColor Cyan

# Find cloudflared.exe
$CloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $CloudflaredPath) {
    $CloudflaredPath = "$env:USERPROFILE\.cloudflared\cloudflared.exe"
    if (-not (Test-Path $CloudflaredPath)) {
        Write-Host "❌ cloudflared.exe not found!" -ForegroundColor Red
        Write-Host "Please install Cloudflare Tunnel first: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
        exit 1
    }
}

# Find npm.cmd (usually in NodeJS installation)
$NPMPath = Get-Command npm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $NPMPath) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js first: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ cloudflared found: $CloudflaredPath" -ForegroundColor Green
Write-Host "✅ npm found: $NPMPath" -ForegroundColor Green

# Step 3: Stop existing services if they exist
Write-Host "🛑 Stopping existing services..." -ForegroundColor Cyan

$ExistingServices = @("CoffeeTunnel", "CoffeeBackend")
foreach ($ServiceName in $ExistingServices) {
    try {
        & $NSSMPath stop $ServiceName 2>$null
        & $NSSMPath remove $ServiceName confirm 2>$null
        Write-Host "✅ Removed existing service: $ServiceName" -ForegroundColor Green
    } catch {
        # Service doesn't exist, which is fine
    }
}

# Step 4: Install Cloudflare Tunnel Service
Write-Host "🌐 Installing Cloudflare Tunnel Service..." -ForegroundColor Cyan

$TunnelServiceName = "CoffeeTunnel"
$TunnelArgs = "tunnel run k2-coffee"

& $NSSMPath install $TunnelServiceName $CloudflaredPath $TunnelArgs
& $NSSMPath set $TunnelServiceName DisplayName "K2 Coffee Cloudflare Tunnel"
& $NSSMPath set $TunnelServiceName Description "Cloudflare tunnel for K2 Coffee Machine access"
& $NSSMPath set $TunnelServiceName Start SERVICE_AUTO_START
& $NSSMPath set $TunnelServiceName AppDirectory $ProjectRoot
& $NSSMPath set $TunnelServiceName AppStdout "$ProjectRoot\logs\tunnel.log"
& $NSSMPath set $TunnelServiceName AppStderr "$ProjectRoot\logs\tunnel-error.log"
& $NSSMPath set $TunnelServiceName AppRotateFiles 1
& $NSSMPath set $TunnelServiceName AppRotateOnline 1
& $NSSMPath set $TunnelServiceName AppRotateSeconds 86400
& $NSSMPath set $TunnelServiceName AppRotateBytes 1048576

Write-Host "✅ Cloudflare Tunnel service installed" -ForegroundColor Green

# Step 5: Install Coffee Backend Service
Write-Host "☕ Installing Coffee Backend Service..." -ForegroundColor Cyan

$BackendServiceName = "CoffeeBackend"
$BackendArgs = "run dev:debug"

& $NSSMPath install $BackendServiceName $NPMPath $BackendArgs
& $NSSMPath set $BackendServiceName DisplayName "K2 Coffee Machine Backend"
& $NSSMPath set $BackendServiceName Description "Node.js backend for K2 Coffee Machine management"
& $NSSMPath set $BackendServiceName Start SERVICE_AUTO_START
& $NSSMPath set $BackendServiceName AppDirectory $ProjectRoot
& $NSSMPath set $BackendServiceName AppStdout "$ProjectRoot\logs\backend.log"
& $NSSMPath set $BackendServiceName AppStderr "$ProjectRoot\logs\backend-error.log"
& $NSSMPath set $BackendServiceName AppRotateFiles 1
& $NSSMPath set $BackendServiceName AppRotateOnline 1
& $NSSMPath set $BackendServiceName AppRotateSeconds 86400
& $NSSMPath set $BackendServiceName AppRotateBytes 1048576

# Set service dependencies (backend should start after tunnel)
& $NSSMPath set $BackendServiceName DependOnService $TunnelServiceName

Write-Host "✅ Coffee Backend service installed" -ForegroundColor Green

# Step 6: Create logs directory
$LogsDir = "$ProjectRoot\logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force
    Write-Host "✅ Created logs directory: $LogsDir" -ForegroundColor Green
}

# Step 7: Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan

try {
    Start-Service $TunnelServiceName
    Write-Host "✅ Started $TunnelServiceName" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Failed to start $TunnelServiceName : $($_.Exception.Message)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

try {
    Start-Service $BackendServiceName
    Write-Host "✅ Started $BackendServiceName" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Failed to start $BackendServiceName : $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 8: Verify services
Write-Host "🔍 Verifying services..." -ForegroundColor Cyan

$Services = Get-Service -Name $TunnelServiceName, $BackendServiceName
foreach ($Service in $Services) {
    $Status = $Service.Status
    $StatusColor = if ($Status -eq "Running") { "Green" } else { "Red" }
    Write-Host "   $($Service.Name): $Status" -ForegroundColor $StatusColor
}

# Step 9: Create management scripts
Write-Host "📝 Creating management scripts..." -ForegroundColor Cyan

# Service control script
$ControlScript = @"
# Coffee Machine Service Control Script
param([string]`$Action = "status")

`$TunnelService = "CoffeeTunnel"
`$BackendService = "CoffeeBackend"

switch (`$Action.ToLower()) {
    "start" {
        Write-Host "🚀 Starting Coffee Machine services..." -ForegroundColor Green
        Start-Service `$TunnelService
        Start-Sleep -Seconds 3
        Start-Service `$BackendService
    }
    "stop" {
        Write-Host "🛑 Stopping Coffee Machine services..." -ForegroundColor Red
        Stop-Service `$BackendService
        Stop-Service `$TunnelService
    }
    "restart" {
        Write-Host "🔄 Restarting Coffee Machine services..." -ForegroundColor Yellow
        Stop-Service `$BackendService
        Stop-Service `$TunnelService
        Start-Sleep -Seconds 2
        Start-Service `$TunnelService
        Start-Sleep -Seconds 3
        Start-Service `$BackendService
    }
    "status" {
        Write-Host "📊 Coffee Machine Service Status:" -ForegroundColor Cyan
        Get-Service -Name `$TunnelService, `$BackendService | Format-Table Name, Status, StartType
    }
    "logs" {
        Write-Host "📋 Recent service logs:" -ForegroundColor Cyan
        Write-Host "--- Tunnel Logs ---" -ForegroundColor Yellow
        Get-Content "$ProjectRoot\logs\tunnel.log" -Tail 10 -ErrorAction SilentlyContinue
        Write-Host "--- Backend Logs ---" -ForegroundColor Yellow
        Get-Content "$ProjectRoot\logs\backend.log" -Tail 10 -ErrorAction SilentlyContinue
    }
    default {
        Write-Host "Usage: .\control-services.ps1 [start|stop|restart|status|logs]" -ForegroundColor Yellow
    }
}
"@

$ControlScript | Out-File -FilePath "$ProjectRoot\control-services.ps1" -Encoding UTF8
Write-Host "✅ Created control-services.ps1" -ForegroundColor Green

# Uninstall script
$UninstallScript = @"
# Uninstall Coffee Machine Services
Write-Host "🗑️ Uninstalling Coffee Machine services..." -ForegroundColor Red

`$NSSMPath = "`$PSScriptRoot\nssm.exe"
`$Services = @("CoffeeBackend", "CoffeeTunnel")

foreach (`$ServiceName in `$Services) {
    try {
        & `$NSSMPath stop `$ServiceName 2>`$null
        & `$NSSMPath remove `$ServiceName confirm 2>`$null
        Write-Host "✅ Removed service: `$ServiceName" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Service `$ServiceName was not found" -ForegroundColor Yellow
    }
}

Write-Host "✅ All services uninstalled" -ForegroundColor Green
"@

$UninstallScript | Out-File -FilePath "$ProjectRoot\uninstall-services.ps1" -Encoding UTF8
Write-Host "✅ Created uninstall-services.ps1" -ForegroundColor Green

# Final summary
Write-Host ""
Write-Host "🎉 Installation Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Services installed:" -ForegroundColor Cyan
Write-Host "  • CoffeeTunnel  - Cloudflare tunnel (k2-coffee)" -ForegroundColor White
Write-Host "  • CoffeeBackend - Node.js backend server" -ForegroundColor White
Write-Host ""
Write-Host "Management commands:" -ForegroundColor Cyan
Write-Host "  • .\control-services.ps1 status   - Check service status" -ForegroundColor White
Write-Host "  • .\control-services.ps1 start    - Start services" -ForegroundColor White
Write-Host "  • .\control-services.ps1 stop     - Stop services" -ForegroundColor White
Write-Host "  • .\control-services.ps1 restart  - Restart services" -ForegroundColor White
Write-Host "  • .\control-services.ps1 logs     - View recent logs" -ForegroundColor White
Write-Host "  • .\uninstall-services.ps1        - Remove services" -ForegroundColor White
Write-Host ""
Write-Host "Logs location: $ProjectRoot\logs\" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Your Coffee Machine will now start automatically on boot!" -ForegroundColor Green
