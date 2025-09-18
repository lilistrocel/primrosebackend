# Coffee Machine Network Setup Script
# This script configures the frontend to connect to the backend IP

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendIP
)

Write-Host "🔧 Configuring Coffee Machine Network..." -ForegroundColor Green
Write-Host "Backend IP: $BackendIP" -ForegroundColor Blue

# Create frontend .env file
$frontendEnv = @"
# Frontend Environment Configuration
# Generated automatically by setup-network.ps1

# Backend API URL
REACT_APP_API_BASE_URL=http://${BackendIP}:3000

# Frontend server configuration
HOST=0.0.0.0
PORT=3001

# Build configuration
GENERATE_SOURCEMAP=false
ESLINT_NO_DEV_ERRORS=true
"@

# Write to frontend .env file
$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding utf8 -Force

Write-Host "✅ Created frontend/.env file" -ForegroundColor Green

# Show current configuration
Write-Host ""
Write-Host "📋 Network Configuration:" -ForegroundColor Yellow
Write-Host "  Backend API: http://${BackendIP}:3000/api/motong/" -ForegroundColor White
Write-Host "  Frontend UI: http://${BackendIP}:3001/" -ForegroundColor White
Write-Host ""

# Show next steps
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. npm run frontend:build    # Rebuild frontend with new config" -ForegroundColor White
Write-Host "2. npm start                 # Start backend (if not running)" -ForegroundColor White
Write-Host "3. npm run frontend:start    # Start frontend" -ForegroundColor White
Write-Host ""
Write-Host "☕ Coffee Machine Configuration:" -ForegroundColor Yellow
Write-Host "Point your coffee machine to: http://${BackendIP}:3000/api/motong/" -ForegroundColor White

Write-Host ""
Write-Host "✅ Network setup complete!" -ForegroundColor Green
