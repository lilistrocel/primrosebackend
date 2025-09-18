# Coffee Machine Deployment Script for Windows
# PowerShell version of deploy.sh

param(
    [switch]$SkipInstall,
    [switch]$HealthOnly,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

Write-Host "🚀 Starting Coffee Machine Deployment..." -ForegroundColor $Green
Write-Host "Date: $(Get-Date)" -ForegroundColor $Blue
Write-Host ""

try {
    # Check if git is available
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git is not installed. Please install git first."
        exit 1
    }

    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        Write-Error "Not a git repository. Run 'git init' first."
        exit 1
    }

    # Pull latest changes
    Write-Status "Pulling latest changes from repository..."
    try {
        git pull origin main
        Write-Success "Code updated successfully"
    }
    catch {
        Write-Warning "Git pull failed or no changes available"
    }

    # Check if Node.js is installed
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    }

    # Check Node.js version
    $nodeVersion = (node --version) -replace 'v', ''
    $majorVersion = ($nodeVersion -split '\.')[0]
    if ([int]$majorVersion -lt 16) {
        Write-Error "Node.js version $nodeVersion is too old. Please upgrade to version 16+."
        exit 1
    }

    if (-not $SkipInstall) {
        # Install/update backend dependencies
        Write-Status "Installing backend dependencies..."
        npm install --production
        Write-Success "Backend dependencies installed"

        # Install/update frontend dependencies
        Write-Status "Installing frontend dependencies..."
        Set-Location frontend
        npm install --production
        Set-Location ..
        Write-Success "Frontend dependencies installed"
    }

    # Build frontend for production
    Write-Status "Building frontend for production..."
    npm run frontend:build
    Write-Success "Frontend built successfully"

    # Backup current database if it exists
    if (Test-Path "coffee_machine.db") {
        Write-Status "Backing up existing database..."
        $backupName = "coffee_machine_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
        if (-not (Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups" | Out-Null
        }
        Copy-Item "coffee_machine.db" "backups\$backupName"
        Write-Success "Database backed up as $backupName"
    }

    # Initialize or update database
    Write-Status "Initializing database..."
    try {
        npm run init-db
        Write-Success "Database initialized"
    }
    catch {
        Write-Warning "Database initialization failed, using existing database"
    }

    if ($HealthOnly) {
        Write-Status "Running health check only..."
        npm run health
        exit 0
    }

    # Check if PM2 is available
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        Write-Status "Restarting services with PM2..."
        
        # Stop existing processes
        try { pm2 stop coffee-backend 2>$null } catch { Write-Warning "coffee-backend was not running" }
        try { pm2 stop coffee-frontend 2>$null } catch { Write-Warning "coffee-frontend was not running" }
        
        # Start backend
        pm2 start ecosystem.config.js
        Write-Success "Backend started with PM2"
        
        # Start frontend (serve static files)
        try {
            pm2 serve frontend/build 3001 --name "coffee-frontend" --spa
            Write-Success "Frontend started with PM2"
        }
        catch {
            Write-Warning "Failed to start frontend with PM2, may already be running"
        }
        
        # Save PM2 configuration
        pm2 save
    }
    else {
        Write-Warning "PM2 not found. You'll need to start services manually:"
        Write-Host "  Backend: npm start"
        Write-Host "  Frontend: cd frontend && npm start"
    }

    # Wait for services to start
    Write-Status "Waiting for services to start..."
    Start-Sleep -Seconds 5

    # Run health check
    Write-Status "Running health check..."
    try {
        npm run health
        Write-Success "Health check passed"
    }
    catch {
        Write-Warning "Health check failed - services may still be starting"
    }

    # Display service information
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor $Green
    Write-Success "Deployment completed successfully!"
    Write-Host "=================================================================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📊 Service Information:"
    Write-Host "  Backend API: http://localhost:3000/api/motong/"
    Write-Host "  Frontend UI: http://localhost:3001/"
    Write-Host "  Health Check: http://localhost:3000/health"
    Write-Host ""
    Write-Host "🔧 Management Commands:"
    Write-Host "  Check status: pm2 status"
    Write-Host "  View logs: pm2 logs"
    Write-Host "  Restart: pm2 restart all"
    Write-Host "  Health check: npm run health"
    Write-Host ""
    Write-Host "📱 Coffee Machine Configuration:"
    Write-Host "  Point your coffee machine to: http://YOUR_SERVER_IP:3000/api/motong/"
    Write-Host ""
    Write-Host "🎯 Next Steps:"
    Write-Host "  1. Update YOUR_SERVER_IP in coffee machine settings"
    Write-Host "  2. Test API endpoints with your coffee machine"
    Write-Host "  3. Monitor logs for any issues"
    Write-Host ""
    Write-Success "Your coffee machine backend is ready for production! ☕"

}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Host "Check the error message above and try again." -ForegroundColor $Yellow
    exit 1
}
