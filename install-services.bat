@echo off
echo ☕ Coffee Machine Service Installer
echo ==================================

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ❌ This script must be run as Administrator!
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo 🚀 Installing Coffee Machine services...
echo.

REM Run the PowerShell installation script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0install-windows-services.ps1"

echo.
echo 🎉 Installation completed!
echo.
echo Your Coffee Machine services are now installed and will start automatically on boot.
echo.
pause
