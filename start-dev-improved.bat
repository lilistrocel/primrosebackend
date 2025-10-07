@echo off
REM Coffee Machine Development Startup Script (Improved Version - Batch)
REM Starts backend, frontend, and monitors system health with proper process management
REM
REM Usage:
REM   start-dev-improved.bat                    # Normal mode (background services)
REM   start-dev-improved.bat debug             # Debug mode (shows real-time backend logs)
REM   start-dev-improved.bat health            # Health check only
REM   start-dev-improved.bat skip              # Skip dependency installation

setlocal enabledelayedexpansion

REM Default parameters
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=3001"
set "SKIP_INSTALL=false"
set "HEALTH_ONLY=false"
set "SHOW_LOGS=false"
set "QUIET=false"

REM Parse command line arguments
if "%1"=="debug" set "SHOW_LOGS=true"
if "%1"=="health" set "HEALTH_ONLY=true"
if "%1"=="skip" set "SKIP_INSTALL=true"
if "%1"=="quiet" set "QUIET=true"

REM Colors (using ANSI escape codes)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "GRAY=[90m"
set "RESET=[0m"

REM Job tracking file
set "JOB_TRACKER_FILE=.dev-jobs.json"

echo.
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  COFFEE MACHINE DEVELOPMENT ENVIRONMENT%RESET%
echo %CYAN%===============================================================%RESET%
echo.

REM Show system info
echo %GREEN%Node.js Version:%RESET% 
node --version
echo %GREEN%NPM Version:%RESET%
npm --version
echo %GREEN%Working Directory:%RESET% %CD%
echo.

if "%HEALTH_ONLY%"=="true" goto :health_check

REM Clean up any existing processes
call :cleanup_existing_jobs

if "%SKIP_INSTALL%"=="false" call :install_dependencies

call :initialize_database

if "%SHOW_LOGS%"=="true" goto :debug_mode

REM Normal mode: start both services in background
call :start_backend
call :start_frontend

call :save_job_tracker

echo.
call :show_health_status
call :show_urls

echo.
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  MONITORING SERVICES%RESET%
echo %CYAN%===============================================================%RESET%
echo %YELLOW%Press Ctrl+C to stop all services and exit%RESET%
echo %CYAN%Use 'stop-dev.bat' to gracefully stop services%RESET%
echo.

:monitor_loop
timeout /t 30 /nobreak >nul
call :health_check
goto :monitor_loop

:debug_mode
echo %YELLOW%[DEBUG MODE] Starting frontend in background...%RESET%
call :start_frontend
echo %BLUE%Frontend starting in background...%RESET%
timeout /t 3 /nobreak >nul
echo.
echo %CYAN%Frontend will be available at: http://localhost:%FRONTEND_PORT%%RESET%
echo %CYAN%Backend logs will be shown below in real-time:%RESET%
echo %GREEN%Look for: 'MACHINE API CALL DETECTED:' for machine communication%RESET%
echo.
call :start_backend_foreground
goto :end

:health_check
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  SYSTEM HEALTH CHECK%RESET%
echo %CYAN%===============================================================%RESET%

call :test_port %BACKEND_PORT% "Backend"
set "BACKEND_OK=!ERRORLEVEL!"

call :test_port %FRONTEND_PORT% "Frontend"
set "FRONTEND_OK=!ERRORLEVEL!"

if "!BACKEND_OK!"=="0" call :test_backend_health
if "!FRONTEND_OK!"=="0" call :test_frontend_health

echo.

if "!BACKEND_OK!"=="0" if "!FRONTEND_OK!"=="0" (
    echo %GREEN%[SUCCESS] ALL SYSTEMS OPERATIONAL%RESET%
    echo %GREEN%   Coffee Machine Management System is ready!%RESET%
) else if "!BACKEND_OK!"=="0" (
    echo %YELLOW%[WARNING] BACKEND ONLY RUNNING%RESET%
    echo %YELLOW%   Coffee machine can connect, but no web interface%RESET%
) else if "!FRONTEND_OK!"=="0" (
    echo %YELLOW%[WARNING] FRONTEND ONLY RUNNING%RESET%
    echo %YELLOW%   Web interface available, but no backend connection%RESET%
) else (
    echo %RED%[ERROR] SYSTEM DOWN%RESET%
    echo %RED%   Neither backend nor frontend is running%RESET%
)

if "%HEALTH_ONLY%"=="true" (
    call :show_urls
    goto :end
)
goto :eof

:cleanup_existing_jobs
echo %BLUE%Cleaning up any existing development processes...%RESET%

REM Load previous job info if exists
if exist "%JOB_TRACKER_FILE%" (
    echo %GRAY%Found previous job session%RESET%
    del "%JOB_TRACKER_FILE%" 2>nul
)

REM Stop any existing Node.js processes
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping existing Node.js processes...%RESET%
    taskkill /F /IM node.exe 2>nul
    timeout /t 2 /nobreak >nul
)

REM Stop any existing npm processes
tasklist /FI "IMAGENAME eq npm.exe" 2>nul | find /I "npm.exe" >nul
if !ERRORLEVEL! equ 0 (
    echo %GRAY%  Stopping existing npm processes...%RESET%
    taskkill /F /IM npm.exe 2>nul
    timeout /t 2 /nobreak >nul
)

goto :eof

:install_dependencies
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  INSTALLING DEPENDENCIES%RESET%
echo %CYAN%===============================================================%RESET%

REM Backend dependencies
if exist "package.json" (
    echo %BLUE%Installing backend dependencies...%RESET%
    npm install --silent
    if !ERRORLEVEL! neq 0 (
        echo %RED%[ERROR] Backend dependency installation failed%RESET%
        exit /b 1
    )
    echo %GREEN%[OK] Backend dependencies installed%RESET%
)

REM Frontend dependencies
if exist "frontend\package.json" (
    echo %BLUE%Installing frontend dependencies...%RESET%
    cd frontend
    npm install --silent
    if !ERRORLEVEL! neq 0 (
        echo %RED%[ERROR] Frontend dependency installation failed%RESET%
        cd ..
        exit /b 1
    )
    cd ..
    echo %GREEN%[OK] Frontend dependencies installed%RESET%
)

goto :eof

:initialize_database
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  INITIALIZING DATABASE%RESET%
echo %CYAN%===============================================================%RESET%

if not exist "coffee_machine.db" (
    echo %BLUE%Creating database with mock data...%RESET%
    npm run init-db
    if !ERRORLEVEL! neq 0 (
        echo %RED%[ERROR] Database initialization failed%RESET%
        exit /b 1
    )
    echo %GREEN%[OK] Database initialized successfully%RESET%
) else (
    echo %GREEN%[OK] Database already exists%RESET%
)

goto :eof

:start_backend
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  STARTING BACKEND SERVER%RESET%
echo %CYAN%===============================================================%RESET%

REM Kill any existing process on backend port
netstat -ano | findstr ":%BACKEND_PORT% " >nul
if !ERRORLEVEL! equ 0 (
    echo %YELLOW%[WARNING] Port %BACKEND_PORT% is in use, attempting to free it...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% "') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo %BLUE%Starting backend on port %BACKEND_PORT%...%RESET%

REM Start backend in background
start "CoffeeBackend" /MIN cmd /c "set PORT=%BACKEND_PORT% && npm start"

REM Wait for backend to start
echo %YELLOW%Waiting for backend to start...%RESET%
set "attempts=0"
set "max_attempts=30"

:backend_wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
call :test_port %BACKEND_PORT% "Backend"
if !ERRORLEVEL! equ 0 goto :backend_started
if !attempts! lss !max_attempts! (
    if "%QUIET%"=="false" echo|set /p="."
    goto :backend_wait_loop
)

echo.
echo %RED%[ERROR] Backend failed to start within %max_attempts% seconds%RESET%
exit /b 1

:backend_started
echo.
timeout /t 2 /nobreak >nul
call :test_backend_health
echo %CYAN%Backend URL: http://localhost:%BACKEND_PORT%%RESET%
echo %CYAN%Health Check: http://localhost:%BACKEND_PORT%/health%RESET%
echo %CYAN%API Base: http://localhost:%BACKEND_PORT%/api/motong/%RESET%

goto :eof

:start_backend_foreground
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  STARTING BACKEND SERVER (FOREGROUND)%RESET%
echo %CYAN%===============================================================%RESET%

REM Kill any existing process on backend port
netstat -ano | findstr ":%BACKEND_PORT% " >nul
if !ERRORLEVEL! equ 0 (
    echo %YELLOW%[WARNING] Port %BACKEND_PORT% is in use, attempting to free it...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% "') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo %BLUE%Starting backend on port %BACKEND_PORT% (foreground mode)...%RESET%
echo %YELLOW%[DEBUG MODE] Backend logs will be shown in real-time%RESET%
echo %GREEN%Look for: 'MACHINE API CALL DETECTED:' for machine communication%RESET%
echo %YELLOW%Press Ctrl+C to stop services and exit%RESET%
echo.

set PORT=%BACKEND_PORT%
npm start

goto :eof

:start_frontend
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  STARTING FRONTEND APPLICATION%RESET%
echo %CYAN%===============================================================%RESET%

if not exist "frontend" (
    echo %RED%[ERROR] Frontend directory not found%RESET%
    goto :eof
)

REM Kill any existing process on frontend port
netstat -ano | findstr ":%FRONTEND_PORT% " >nul
if !ERRORLEVEL! equ 0 (
    echo %YELLOW%[WARNING] Port %FRONTEND_PORT% is in use, attempting to free it...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% "') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo %BLUE%Starting frontend on port %FRONTEND_PORT%...%RESET%

REM Start frontend in background
start "CoffeeFrontend" /MIN cmd /c "cd frontend && set PORT=%FRONTEND_PORT% && set BROWSER=none && npm start"

REM Wait for frontend to start
echo %YELLOW%Waiting for frontend to start...%RESET%
set "attempts=0"
set "max_attempts=60"

:frontend_wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
call :test_port %FRONTEND_PORT% "Frontend"
if !ERRORLEVEL! equ 0 goto :frontend_started
if !attempts! lss !max_attempts! (
    if "%QUIET%"=="false" echo|set /p="."
    goto :frontend_wait_loop
)

echo.
echo %RED%[ERROR] Frontend failed to start within %max_attempts% seconds%RESET%
echo %YELLOW%   Check 'npm install' was successful in frontend directory%RESET%
goto :eof

:frontend_started
echo.
timeout /t 3 /nobreak >nul
call :test_frontend_health
echo %CYAN%Frontend URL: http://localhost:%FRONTEND_PORT%%RESET%
echo %CYAN%Management Interface: http://localhost:%FRONTEND_PORT%%RESET%

goto :eof

:test_port
set "port=%1"
set "service_name=%2"

REM Test if port is listening
netstat -ano | findstr ":%port% " >nul
if !ERRORLEVEL! equ 0 (
    echo %GREEN%[OK] %service_name% is running on port %port%%RESET%
    exit /b 0
) else (
    echo %RED%[ERROR] %service_name% is not responding on port %port%%RESET%
    exit /b 1
)

:test_backend_health
REM Test backend health endpoint
curl -s -m 5 http://localhost:%BACKEND_PORT%/health >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo %GREEN%[OK] Backend health check: OK%RESET%
) else (
    echo %RED%[ERROR] Backend health check failed%RESET%
)

goto :eof

:test_frontend_health
REM Test frontend health
curl -s -m 5 http://localhost:%FRONTEND_PORT% >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo %GREEN%[OK] Frontend is serving correctly%RESET%
) else (
    echo %RED%[ERROR] Frontend health check failed%RESET%
)

goto :eof

:show_urls
echo %CYAN%===============================================================%RESET%
echo %YELLOW%  ACCESS POINTS%RESET%
echo %CYAN%===============================================================%RESET%
echo %WHITE%Backend Services:%RESET%
echo %CYAN%  Health Check:    http://localhost:%BACKEND_PORT%/health%RESET%
echo %CYAN%  API Endpoint:    http://localhost:%BACKEND_PORT%/api/motong/%RESET%
echo %CYAN%  Server Info:     http://localhost:%BACKEND_PORT%/%RESET%
echo.
echo %WHITE%Frontend Application:%RESET%
echo %CYAN%  Management UI:   http://localhost:%FRONTEND_PORT%/%RESET%
echo %CYAN%  Item Manager:    http://localhost:%FRONTEND_PORT%/items%RESET%
echo %CYAN%  Order Monitor:   http://localhost:%FRONTEND_PORT%/orders%RESET%
echo %CYAN%  Alert Dashboard: http://localhost:%FRONTEND_PORT%/alerts%RESET%
echo %CYAN%  Device Status:   http://localhost:%FRONTEND_PORT%/device%RESET%
echo.
echo %WHITE%Coffee Machine Configuration:%RESET%
echo %YELLOW%  Change machine URL to: http://localhost:%BACKEND_PORT%/api/motong/%RESET%

goto :eof

:save_job_tracker
echo %GREEN%[INFO] Job tracking saved%RESET%
echo {"BackendPort":%BACKEND_PORT%,"FrontendPort":%FRONTEND_PORT%,"StartTime":"%DATE% %TIME%"} > "%JOB_TRACKER_FILE%"

goto :eof

:end
echo.
echo %GREEN%[SUCCESS] Coffee Machine Development Environment started%RESET%

REM Cleanup on exit
if exist "%JOB_TRACKER_FILE%" del "%JOB_TRACKER_FILE%" 2>nul

endlocal
exit /b 0
