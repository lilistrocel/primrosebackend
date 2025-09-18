@echo off
echo ======================================
echo    COFFEE MACHINE API MONITOR
echo ======================================
echo.
echo This will bypass PowerShell execution policy restrictions
echo Press Ctrl+C to stop monitoring
echo.
pause
echo Starting API monitor...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0simple-api-monitor.ps1"

pause
