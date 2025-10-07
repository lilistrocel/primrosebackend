@echo off
REM Comprehensive Process Cleanup Script (Batch Version)
REM Stops all coffee machine related processes and clears caches

setlocal enabledelayedexpansion

REM Default parameters
set "FORCE=false"
set "CLEAR_CACHE=false"

REM Parse command line arguments
if "%1"=="force" set "FORCE=true"
if "%2"=="cache" set "CLEAR_CACHE=true"
if "%1"=="cache" set "CLEAR_CACHE=true"

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
echo %YELLOW%  COMPREHENSIVE PROCESS CLEANUP%RESET%
echo %CYAN%===============================================================%RESET%
echo.

if "%FORCE%"=="true" (
    echo %YELLOW%[WARNING] Force mode enabled - all processes will be killed immediately%RESET%
)

if "%CLEAR_CACHE%"=="true" (
    echo %YELLOW%[INFO] Cache clearing enabled%RESET%
)

REM Stop all processes
call :stop_all_node_processes
call :stop_all_npm_processes
call :stop_all_react_processes
call :stop_all_port_processes
call :cleanup_job_objects

REM Clear caches if requested
if "%CLEAR_CACHE%"=="true" (
    call :clear_frontend_cache
    call :clear_backend_cache
)

REM Wait for processes to fully stop
timeout /t 3 /nobreak >nul

REM Show final status
call :show_running_processes

echo.
echo %GREEN%[SUCCESS] Cleanup completed%RESET%

if "%CLEAR_CACHE%"=="true" (
    echo %YELLOW%All caches have been cleared - you may need to run 'npm install' again%RESET%
)

endlocal
exit /b 0

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
echo %BLUE%Stopping all npm processes...%RESET%

tasklist /FI "IMAGENAME eq npm.exe" 2>nul | find /I "npm.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping npm processes...%RESET%
    taskkill /F /IM npm.exe 2>nul
) else (
    echo %GRAY%  No npm processes found%RESET%
)

goto :eof

:stop_all_react_processes
echo %BLUE%Stopping all React development processes...%RESET%

REM Look for processes that might be running React dev server
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping React processes...%RESET%
    taskkill /F /IM node.exe 2>nul
) else (
    echo %GRAY%  No React processes found%RESET%
)

goto :eof

:stop_all_port_processes
echo %BLUE%Stopping all processes on development ports...%RESET%

set "ports=3000 3001 3002 8080 8000"

for %%p in (%ports%) do (
    netstat -ano | findstr ":%%p " >nul
    if !ERRORLEVEL! equ 0 (
        echo %GRAY%  Stopping processes on port %%p...%RESET%
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
            if not "%%a"=="0" (
                taskkill /F /PID %%a 2>nul
            )
        )
    )
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

:clear_frontend_cache
echo %BLUE%Clearing frontend cache...%RESET%

if exist "frontend\node_modules" (
    echo %GRAY%  Removing node_modules...%RESET%
    rmdir /s /q "frontend\node_modules" 2>nul
)

if exist "frontend\build" (
    echo %GRAY%  Removing build directory...%RESET%
    rmdir /s /q "frontend\build" 2>nul
)

if exist "frontend\.cache" (
    echo %GRAY%  Removing .cache directory...%RESET%
    rmdir /s /q "frontend\.cache" 2>nul
)

REM Clear npm cache
echo %GRAY%  Clearing npm cache...%RESET%
npm cache clean --force 2>nul

echo %GREEN%  [OK] Frontend cache cleared%RESET%

goto :eof

:clear_backend_cache
echo %BLUE%Clearing backend cache...%RESET%

if exist "node_modules" (
    echo %GRAY%  Removing node_modules...%RESET%
    rmdir /s /q "node_modules" 2>nul
)

REM Clear npm cache
echo %GRAY%  Clearing npm cache...%RESET%
npm cache clean --force 2>nul

echo %GREEN%  [OK] Backend cache cleared%RESET%

goto :eof

:show_running_processes
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  CHECKING REMAINING PROCESSES%RESET%
echo %CYAN%===============================================================%RESET%

REM Check Node.js processes
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %WHITE%Node.js processes still running:%RESET%
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo %GREEN%No Node.js processes running%RESET%
)

REM Check npm processes
tasklist /FI "IMAGENAME eq npm.exe" 2>nul | find /I "npm.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %WHITE%npm processes still running:%RESET%
    tasklist /FI "IMAGENAME eq npm.exe" /FO TABLE
) else (
    echo %GREEN%No npm processes running%RESET%
)

REM Check ports
set "ports=3000 3001 3002"
for %%p in (%ports%) do (
    netstat -ano | findstr ":%%p " >nul
    if !ERRORLEVEL! equ 0 (
        echo %RED%Port %%p is still in use%RESET%
    ) else (
        echo %GREEN%Port %%p is free%RESET%
    )
)

goto :eof
