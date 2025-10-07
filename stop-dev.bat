@echo off
REM Coffee Machine Development Stop Script (Batch Version)
REM Gracefully stops backend and frontend services
REM
REM Usage:
REM   stop-dev.bat                    # Stop all services
REM   stop-dev.bat force              # Force kill all processes
REM   stop-dev.bat backend            # Stop only backend
REM   stop-dev.bat frontend           # Stop only frontend

setlocal enabledelayedexpansion

REM Default parameters
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=3001"
set "FORCE=false"
set "BACKEND_ONLY=false"
set "FRONTEND_ONLY=false"

REM Parse command line arguments
if "%1"=="force" set "FORCE=true"
if "%1"=="backend" set "BACKEND_ONLY=true"
if "%1"=="frontend" set "FRONTEND_ONLY=true"

REM Colors (using ANSI escape codes)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "GRAY=[90m"
set "RESET=[0m"

echo.
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  STOPPING COFFEE MACHINE DEVELOPMENT SERVICES%RESET%
echo %CYAN%===============================================================%RESET%
echo.

if "%FORCE%"=="true" (
    echo %YELLOW%[WARNING] Force mode enabled - processes will be killed immediately%RESET%
)

REM Stop services based on parameters
if not "%FRONTEND_ONLY%"=="true" call :stop_service_by_port %BACKEND_PORT% "Backend"
if not "%BACKEND_ONLY%"=="true" call :stop_service_by_port %FRONTEND_PORT% "Frontend"

REM Additional cleanup
if "%FORCE%"=="true" (
    call :stop_all_node_processes
    call :stop_all_npm_processes
)

call :cleanup_job_objects

REM Wait a moment for processes to fully stop
timeout /t 2 /nobreak >nul

REM Show final status
call :show_running_services

echo.
if "%FORCE%"=="true" (
    echo %GREEN%[SUCCESS] All processes have been forcefully terminated%RESET%
) else (
    echo %GREEN%[SUCCESS] Services have been gracefully stopped%RESET%
)

endlocal
exit /b 0

:stop_service_by_port
set "port=%1"
set "service_name=%2"

echo %BLUE%Stopping %service_name% on port %port%...%RESET%

REM Find processes using the port
netstat -ano | findstr ":%port% " >nul
if !ERRORLEVEL! equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%port% "') do (
        set "process_id=%%a"
        if not "!process_id!"=="0" (
            echo %GRAY%  Found process on port %port% (PID: !process_id!)%RESET%
            
            if "%FORCE%"=="true" (
                echo %YELLOW%  Force killing process...%RESET%
                taskkill /F /PID !process_id! 2>nul
            ) else (
                echo %GREEN%  Gracefully stopping process...%RESET%
                taskkill /PID !process_id! 2>nul
                timeout /t 2 /nobreak >nul
                taskkill /F /PID !process_id! 2>nul
            )
        )
    )
) else (
    echo %GRAY%  No processes found on port %port%%RESET%
)

REM Wait for port to be released
set "attempts=0"
set "max_attempts=10"

:port_wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
netstat -ano | findstr ":%port% " >nul
if !ERRORLEVEL! equ 0 (
    if !attempts! lss !max_attempts! (
        echo|set /p="."
        goto :port_wait_loop
    )
)

echo.

if !attempts! geq !max_attempts! (
    echo %YELLOW%  [WARNING] Port %port% may still be in use%RESET%
    exit /b 1
) else (
    echo %GREEN%  [OK] %service_name% stopped successfully%RESET%
    exit /b 0
)

:stop_all_node_processes
echo %BLUE%Stopping all Node.js processes...%RESET%

tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping Node.js processes...%RESET%
    taskkill /F /IM node.exe 2>nul
) else (
    echo %GRAY%  No Node.js processes found%RESET%
)

goto :eof

:stop_all_npm_processes
echo %BLUE%Stopping npm processes...%RESET%

tasklist /FI "IMAGENAME eq npm.exe" 2>nul | find /I "npm.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping npm processes...%RESET%
    taskkill /F /IM npm.exe 2>nul
) else (
    echo %GRAY%  No npm processes found%RESET%
)

goto :eof

:cleanup_job_objects
echo %BLUE%Cleaning up job objects...%RESET%

REM Remove job tracker file if it exists
if exist ".dev-jobs.json" (
    echo %GRAY%  Removing job tracker file...%RESET%
    del ".dev-jobs.json" 2>nul
)

goto :eof

:show_running_services
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  CHECKING REMAINING SERVICES%RESET%
echo %CYAN%===============================================================%RESET%

REM Check backend port
netstat -ano | findstr ":%BACKEND_PORT% " >nul
if !ERRORLEVEL! equ 0 (
    echo %RED%Backend (Port %BACKEND_PORT%): RUNNING%RESET%
) else (
    echo %GREEN%Backend (Port %BACKEND_PORT%): STOPPED%RESET%
)

REM Check frontend port
netstat -ano | findstr ":%FRONTEND_PORT% " >nul
if !ERRORLEVEL! equ 0 (
    echo %RED%Frontend (Port %FRONTEND_PORT%): RUNNING%RESET%
) else (
    echo %GREEN%Frontend (Port %FRONTEND_PORT%): STOPPED%RESET%
)

REM Check for any Node.js processes
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %YELLOW%Node.js processes still running%RESET%
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo %GREEN%No Node.js processes running%RESET%
)

goto :eof
