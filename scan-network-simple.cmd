@echo off
setlocal enabledelayedexpansion
echo ======================================
echo   SIMPLE NETWORK IP SCANNER
echo ======================================
echo.

echo Getting current network configuration...
echo.

echo Your IP addresses:
ipconfig | findstr /i "IPv4"
echo.

echo Scanning common network ranges...
echo.

REM Get the current IP to determine subnet
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "current_ip=%%a"
    goto :found_ip
)
:found_ip

REM Clean up the IP address (remove spaces)
set "current_ip=!current_ip: =!"

REM Extract subnet (assumes /24)
for /f "tokens=1,2,3 delims=." %%a in ("!current_ip!") do (
    set "subnet=%%a.%%b.%%c"
)

echo Scanning subnet: !subnet!.x
echo.

echo Active devices found:
echo.

REM Scan 1-254 range
for /l %%i in (1,1,254) do (
    ping -n 1 -w 1000 !subnet!.%%i >nul 2>&1
    if !errorlevel! equ 0 (
        echo [ONLINE] !subnet!.%%i
        REM Try to get hostname
        nslookup !subnet!.%%i 2>nul | findstr /i "Name:" | findstr /v "Address" >nul
        if !errorlevel! equ 0 (
            for /f "tokens=2 delims=:" %%h in ('nslookup !subnet!.%%i 2^>nul ^| findstr /i "Name:"') do (
                echo    Hostname: %%h
            )
        )
    )
)

echo.
echo ======================================
echo Scan complete!
echo.
echo Tips:
echo - Use 'ping IP' to test specific addresses
echo - Use 'nslookup IP' for hostname resolution
echo - Coffee machines typically use 192.168.10.x range
echo.
pause
