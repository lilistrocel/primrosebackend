# Setup Cloudflare Tunnel for K2 Coffee Machine
param(
    [string]$Domain = "",
    [switch]$UseSubdomain
)

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    ☁️ CLOUDFLARE TUNNEL SETUP FOR K2 COFFEE" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared is installed
try {
    $cfVersion = cloudflared version 2>$null
    Write-Host "✅ Cloudflared installed: $cfVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Cloudflared not found!" -ForegroundColor Red
    Write-Host "Download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    exit 1
}

# Get tunnel ID from the running tunnel logs
$tunnelId = "26b4d1b7-28f0-46f1-894a-8165d521bc7f"
Write-Host "🔍 Using tunnel ID: $tunnelId" -ForegroundColor Blue

if ($Domain -eq "") {
    Write-Host ""
    Write-Host "🌐 Domain Setup Options:" -ForegroundColor Yellow
    Write-Host "1. Use your own domain (recommended)" -ForegroundColor White
    Write-Host "2. Use Cloudflare's temporary subdomain" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-2)"
    
    if ($choice -eq "1") {
        $Domain = Read-Host "Enter your domain (e.g., yourbusiness.com)"
        $UseSubdomain = $false
    } else {
        Write-Host "Using Cloudflare temporary subdomain..." -ForegroundColor Blue
        $UseSubdomain = $true
    }
}

Write-Host ""
Write-Host "🔧 Creating tunnel configuration..." -ForegroundColor Yellow

if ($UseSubdomain) {
    # Use Cloudflare's temporary URLs
    $backendUrl = "https://$tunnelId.cfargotunnel.com"
    $frontendUrl = "https://$tunnelId.cfargotunnel.com"
    
    # Create config for temporary subdomain
    $configContent = @"
tunnel: $tunnelId
credentials-file: ~/.cloudflared/$tunnelId.json

ingress:
  # Coffee machine API (path-based routing)
  - hostname: $tunnelId.cfargotunnel.com
    path: /api/*
    service: http://localhost:3000
    originRequest:
      httpHostHeader: localhost:3000
  
  # Management interface (default)
  - hostname: $tunnelId.cfargotunnel.com
    service: http://localhost:3001
    originRequest:
      httpHostHeader: localhost:3001
  
  # Catch-all
  - service: http_status:404
"@
} else {
    # Use custom domain
    $backendUrl = "https://api.$Domain"
    $frontendUrl = "https://kiosk.$Domain"
    
    # Create config for custom domain
    $configContent = @"
tunnel: $tunnelId
credentials-file: ~/.cloudflared/$tunnelId.json

ingress:
  # Backend API for coffee machine
  - hostname: api.$Domain
    service: http://localhost:3000
    originRequest:
      httpHostHeader: localhost:3000
  
  # Frontend kiosk interface
  - hostname: kiosk.$Domain
    service: http://localhost:3001
    originRequest:
      httpHostHeader: localhost:3001
  
  # Alternative: www subdomain for kiosk
  - hostname: www.$Domain
    service: http://localhost:3001
    originRequest:
      httpHostHeader: localhost:3001
  
  # Root domain for kiosk
  - hostname: $Domain
    service: http://localhost:3001
    originRequest:
      httpHostHeader: localhost:3001
  
  # Catch-all
  - service: http_status:404
"@
}

# Write config file
$configPath = "~/.cloudflared/config.yml"
$configContent | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "✅ Configuration written to: $configPath" -ForegroundColor Green

# Add DNS records if using custom domain
if (-not $UseSubdomain) {
    Write-Host ""
    Write-Host "🌐 DNS Records to Add in Cloudflare Dashboard:" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "Type: CNAME | Name: api.$Domain | Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
    Write-Host "Type: CNAME | Name: kiosk.$Domain | Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
    Write-Host "Type: CNAME | Name: www.$Domain | Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
    Write-Host "Type: CNAME | Name: $Domain | Target: $tunnelId.cfargotunnel.com" -ForegroundColor Cyan
    Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Steps:" -ForegroundColor White
    Write-Host "1. Go to https://dash.cloudflare.com" -ForegroundColor Blue
    Write-Host "2. Select your domain: $Domain" -ForegroundColor Blue
    Write-Host "3. Go to DNS > Records" -ForegroundColor Blue
    Write-Host "4. Add the CNAME records above" -ForegroundColor Blue
    Write-Host "5. Wait 2-3 minutes for DNS propagation" -ForegroundColor Blue
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ CLOUDFLARE TUNNEL CONFIGURED!" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($UseSubdomain) {
    Write-Host "🎯 Your Temporary URLs:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   🖥️  Management Interface:" -ForegroundColor White
    Write-Host "   https://$tunnelId.cfargotunnel.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   ☕ Coffee Machine API:" -ForegroundColor White
    Write-Host "   https://$tunnelId.cfargotunnel.com/api/motong/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🎯 Kiosk Interface:" -ForegroundColor White
    Write-Host "   https://$tunnelId.cfargotunnel.com/kiosk" -ForegroundColor Yellow
} else {
    Write-Host "🎯 Your Custom Domain URLs:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   🖥️  Management Interface:" -ForegroundColor White
    Write-Host "   $frontendUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   ☕ Coffee Machine API:" -ForegroundColor White
    Write-Host "   $backendUrl/api/motong/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🎯 Kiosk Interface:" -ForegroundColor White
    Write-Host "   $frontendUrl/kiosk" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📱 QR Code for Kiosk:" -ForegroundColor White
if ($UseSubdomain) {
    $kioskUrl = "https://$tunnelId.cfargotunnel.com/kiosk"
} else {
    $kioskUrl = "$frontendUrl/kiosk"
}
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$([uri]::EscapeDataString($kioskUrl))"
Write-Host $qrUrl -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Stop your current tunnel (Ctrl+C)" -ForegroundColor Blue
Write-Host "2. Start with new config: cloudflared tunnel run k2-coffee" -ForegroundColor Blue
Write-Host "3. Start your K2 Coffee services: npm start" -ForegroundColor Blue
if (-not $UseSubdomain) {
    Write-Host "4. Add DNS records in Cloudflare dashboard" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 Your K2 Coffee Machine will be accessible worldwide!" -ForegroundColor Green
