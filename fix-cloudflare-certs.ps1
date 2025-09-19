# Fix Cloudflare Tunnel Certificate Issues on Windows
Write-Host "🔧 Fixing Cloudflare Tunnel Certificate Issues..." -ForegroundColor Yellow

# Download the certificate bundle
$certUrl = "https://curl.se/ca/cacert.pem"
$certPath = "$env:USERPROFILE\.cloudflared\cacert.pem"
$cloudflaredDir = "$env:USERPROFILE\.cloudflared"

# Create .cloudflared directory if it doesn't exist
if (!(Test-Path $cloudflaredDir)) {
    New-Item -ItemType Directory -Path $cloudflaredDir -Force
    Write-Host "✅ Created .cloudflared directory" -ForegroundColor Green
}

# Download certificate bundle
Write-Host "📥 Downloading certificate bundle..." -ForegroundColor Blue
try {
    Invoke-WebRequest -Uri $certUrl -OutFile $certPath -UseBasicParsing
    Write-Host "✅ Certificate bundle downloaded to: $certPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download certificate bundle: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can manually download from: $certUrl" -ForegroundColor Yellow
    Write-Host "Save it as: $certPath" -ForegroundColor Yellow
}

# Update the config file to use the certificate
$configPath = "$cloudflaredDir\config.yml"
$tunnelId = "26b4d1b7-28f0-46f1-894a-8165d521bc7f"

$configContent = @"
tunnel: $tunnelId
credentials-file: ~/.cloudflared/$tunnelId.json
origin-ca-pool: ~/.cloudflared/cacert.pem

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

# Write the config file
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "✅ Updated config file: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Your tunnel is now configured with:" -ForegroundColor Cyan
Write-Host "   • Certificate bundle for Windows" -ForegroundColor White
Write-Host "   • Path-based routing for API and frontend" -ForegroundColor White
Write-Host "   • Proper origin headers" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "1. Stop your current tunnel (Ctrl+C)" -ForegroundColor Blue
Write-Host "2. Start backend: npm start" -ForegroundColor Blue
Write-Host "3. Start frontend: cd frontend && npm start" -ForegroundColor Blue
Write-Host "4. Restart tunnel: cloudflared tunnel run k2-coffee" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Your URLs will be:" -ForegroundColor Green
Write-Host "   Management: https://$tunnelId.cfargotunnel.com" -ForegroundColor Yellow
Write-Host "   Coffee API: https://$tunnelId.cfargotunnel.com/api/motong/" -ForegroundColor Yellow
Write-Host "   Kiosk: https://$tunnelId.cfargotunnel.com/kiosk" -ForegroundColor Yellow
