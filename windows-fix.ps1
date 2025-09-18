# Windows Deployment Fix Script
# This script switches the project to use sqlite3 instead of better-sqlite3

Write-Host "🔧 Fixing Coffee Machine Backend for Windows deployment..." -ForegroundColor Green
Write-Host ""

try {
    # Step 1: Clean existing installation
    Write-Host "🧹 Cleaning existing installation..." -ForegroundColor Blue
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force
        Write-Host "✅ Removed node_modules directory" -ForegroundColor Green
    }
    
    if (Test-Path "package-lock.json") {
        Remove-Item "package-lock.json" -Force
        Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
    }
    
    # Step 2: Switch to Windows-compatible package.json
    Write-Host "📦 Switching to Windows-compatible package configuration..." -ForegroundColor Blue
    Copy-Item "package.json" "package-original.json" -Force
    Copy-Item "package-windows.json" "package.json" -Force
    Write-Host "✅ Package configuration updated (original backed up)" -ForegroundColor Green
    
    # Step 3: Switch to Windows-compatible database module
    Write-Host "🗄️ Switching to Windows-compatible database module..." -ForegroundColor Blue
    Copy-Item "src\database\db.js" "src\database\db-original.js" -Force
    Copy-Item "src\database\db-sqlite3.js" "src\database\db.js" -Force
    Write-Host "✅ Database module updated (original backed up)" -ForegroundColor Green
    
    # Step 4: Install dependencies
    Write-Host "📥 Installing Windows-compatible dependencies..." -ForegroundColor Blue
    npm cache clean --force
    npm install --production
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    
    # Step 5: Initialize database
    Write-Host "🗄️ Initializing database..." -ForegroundColor Blue
    npm run init-db
    Write-Host "✅ Database initialized" -ForegroundColor Green
    
    # Step 6: Test the installation
    Write-Host "🧪 Testing installation..." -ForegroundColor Blue
    Start-Sleep -Seconds 2
    npm run health
    Write-Host "✅ Installation test completed" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "🎉 Windows deployment fix completed successfully!" -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Changes made:"
    Write-Host "  ✅ Switched from better-sqlite3 to sqlite3 package"
    Write-Host "  ✅ Updated database module for compatibility"
    Write-Host "  ✅ Installed all dependencies successfully"
    Write-Host "  ✅ Database initialized and ready"
    Write-Host ""
    Write-Host "🚀 Next steps:"
    Write-Host "  1. npm start                 # Start the backend"
    Write-Host "  2. npm run frontend:build    # Build the frontend"
    Write-Host "  3. npm run frontend:start    # Start the frontend"
    Write-Host ""
    Write-Host "🔄 To revert back to original:"
    Write-Host "  1. Copy-Item package-original.json package.json -Force"
    Write-Host "  2. Copy-Item src\database\db-original.js src\database\db.js -Force"
    Write-Host "  3. npm install --production"
    Write-Host ""
    Write-Host "✅ Your coffee machine backend is now Windows-ready! ☕" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ Error during Windows deployment fix:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "🔄 Manual fallback steps:" -ForegroundColor Yellow
    Write-Host "1. Copy-Item package-windows.json package.json -Force"
    Write-Host "2. Copy-Item src\database\db-sqlite3.js src\database\db.js -Force"
    Write-Host "3. npm cache clean --force"
    Write-Host "4. npm install sqlite3@5.1.6"
    Write-Host "5. npm install --production"
    exit 1
}
