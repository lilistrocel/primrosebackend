@echo off
echo ======================================
echo   WATCHING COFFEE MACHINE API CALLS
echo ======================================
echo.
echo This will monitor what URLs the machine is trying to access
echo Press Ctrl+C to stop monitoring
echo.

:loop
echo [%TIME%] Checking network connections...
netstat -an | findstr "192.168.10.2:3000" | findstr "ESTABLISHED\|TIME_WAIT"

echo [%TIME%] Looking for HTTP processes...
netstat -anb 2>nul | findstr "192.168.10.2:3000" -A 1 -B 1

echo [%TIME%] Checking recent DNS lookups...
ipconfig /displaydns | findstr "192.168.10.2\|motong\|swoft" 2>nul

echo ----------------------------------------
timeout /t 10 /nobreak >nul
goto loop
