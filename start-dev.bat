@echo off
REM Coffee Machine Development Startup Script (Windows CMD)
REM Starts backend, frontend, and monitors system health

setlocal enabledelayedexpansion

REM Configuration
set BACKEND_PORT=3000
set FRONTEND_PORT=3001
set SKIP_INSTALL=0
set HEALTH_ONLY=0

REM Parse command line arguments
:parse_args
if "%~1"=="" goto args_done
if "%~1"=="--skip-install" (
    set SKIP_INSTALL=1
    shift
    goto parse_args
)
if "%~1"=="--health-only" (
    set HEALTH_ONLY=1
    shift
    goto parse_args
)
if "%~1"=="--backend-port" (
    set BACKEND_PORT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--frontend-port" (
    set FRONTEND_PORT=%~2
    shift
    shift
    goto parse_args
)
echo Unknown option: %~1
echo Usage: %0 [--skip-install] [--health-only] [--backend-port PORT] [--frontend-port PORT]
exit /b 1

:args_done

echo.
echo ===============================================================
echo   Coffee Machine Development Environment
echo ===============================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    exit /b 1
)

echo Node.js Version: 
node --version

echo NPM Version:
npm --version

echo Working Directory: %CD%
echo.

REM Health check only
if %HEALTH_ONLY%==1 goto health_check

REM Install dependencies
if %SKIP_INSTALL%==1 (
    echo [INFO] Skipping dependency installation
) else (
    echo ===============================================================
    echo   Installing Dependencies
    echo ===============================================================
    echo.
    
    if exist "package.json" (
        echo Installing backend dependencies...
        call npm install --silent
        if errorlevel 1 (
            echo [ERROR] Backend dependency installation failed
            exit /b 1
        )
        echo [OK] Backend dependencies installed
    )
    
    if exist "frontend\package.json" (
        echo Installing frontend dependencies...
        cd frontend
        call npm install --silent
        if errorlevel 1 (
            echo [ERROR] Frontend dependency installation failed
            exit /b 1
        )
        echo [OK] Frontend dependencies installed
        cd ..
    )
)

REM Initialize database
echo.
echo ===============================================================
echo   Initializing Database
echo ===============================================================
echo.

if not exist "coffee_machine.db" (
    echo Creating database with mock data...
    call npm run init-db
    if errorlevel 1 (
        echo [ERROR] Database initialization failed
        exit /b 1
    )
    echo [OK] Database initialized successfully
) else (
    echo [OK] Database already exists
)

REM Start backend
echo.
echo ===============================================================
echo   Starting Backend Server
echo ===============================================================
echo.

echo Starting backend on port %BACKEND_PORT%...
start "Coffee Backend" cmd /c "set PORT=%BACKEND_PORT% && npm start"

REM Wait for backend
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Test backend port
for /f %%i in ('powershell -command "Test-NetConnection -ComputerName localhost -Port %BACKEND_PORT% -InformationLevel Quiet"') do set BACKEND_RUNNING=%%i

if "%BACKEND_RUNNING%"=="True" (
    echo [OK] Backend is running on port %BACKEND_PORT%
) else (
    echo [ERROR] Backend failed to start
    goto cleanup
)

REM Start frontend
echo.
echo ===============================================================
echo   Starting Frontend Application
echo ===============================================================
echo.

if not exist "frontend" (
    echo [ERROR] Frontend directory not found
    goto cleanup
)

echo Starting frontend on port %FRONTEND_PORT%...
cd frontend
start "Coffee Frontend" cmd /c "set PORT=%FRONTEND_PORT% && set BROWSER=none && npm start"
cd ..

REM Wait for frontend
echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

REM Test frontend port
for /f %%i in ('powershell -command "Test-NetConnection -ComputerName localhost -Port %FRONTEND_PORT% -InformationLevel Quiet"') do set FRONTEND_RUNNING=%%i

if "%FRONTEND_RUNNING%"=="True" (
    echo [OK] Frontend is running on port %FRONTEND_PORT%
) else (
    echo [WARNING] Frontend may still be starting...
)

:health_check
echo.
echo ===============================================================
echo   System Health Check
echo ===============================================================
echo.

REM Check backend
for /f %%i in ('powershell -command "Test-NetConnection -ComputerName localhost -Port %BACKEND_PORT% -InformationLevel Quiet"') do set BACKEND_OK=%%i

if "%BACKEND_OK%"=="True" (
    echo [OK] Backend is running on port %BACKEND_PORT%
    
    REM Test backend health endpoint
    powershell -command "try { $response = Invoke-RestMethod -Uri 'http://localhost:%BACKEND_PORT%/health' -Method Get -TimeoutSec 3; if ($response.status -eq 'OK') { Write-Host '[OK] Backend health check: OK' } else { Write-Host '[WARNING] Backend health check failed' } } catch { Write-Host '[WARNING] Backend health endpoint not responding' }"
) else (
    echo [ERROR] Backend is not running on port %BACKEND_PORT%
)

REM Check frontend
for /f %%i in ('powershell -command "Test-NetConnection -ComputerName localhost -Port %FRONTEND_PORT% -InformationLevel Quiet"') do set FRONTEND_OK=%%i

if "%FRONTEND_OK%"=="True" (
    echo [OK] Frontend is running on port %FRONTEND_PORT%
) else (
    echo [ERROR] Frontend is not running on port %FRONTEND_PORT%
)

REM Check database
if exist "coffee_machine.db" (
    echo [OK] Database file exists: coffee_machine.db
) else (
    echo [WARNING] Database file not found
)

echo.
echo ===============================================================
echo   Access Points
echo ===============================================================
echo.

echo Backend Services:
echo   Health Check:    http://localhost:%BACKEND_PORT%/health
echo   API Endpoint:    http://localhost:%BACKEND_PORT%/api/motong/
echo   Server Info:     http://localhost:%BACKEND_PORT%/
echo.
echo Frontend Application:
echo   Management UI:   http://localhost:%FRONTEND_PORT%/
echo   Item Manager:    http://localhost:%FRONTEND_PORT%/items
echo   Order Monitor:   http://localhost:%FRONTEND_PORT%/orders
echo   Device Status:   http://localhost:%FRONTEND_PORT%/device
echo.
echo Coffee Machine Configuration:
echo   Change machine URL to: http://localhost:%BACKEND_PORT%/api/motong/
echo.

if %HEALTH_ONLY%==1 exit /b 0

REM Overall status
if "%BACKEND_OK%"=="True" if "%FRONTEND_OK%"=="True" (
    echo [SUCCESS] ALL SYSTEMS OPERATIONAL
    echo Coffee Machine Management System is ready!
) else (
    if "%BACKEND_OK%"=="True" (
        echo [WARNING] BACKEND ONLY RUNNING
        echo Coffee machine can connect, but no web interface
    ) else (
        if "%FRONTEND_OK%"=="True" (
            echo [WARNING] FRONTEND ONLY RUNNING  
            echo Web interface available, but no backend connection
        ) else (
            echo [ERROR] SYSTEM DOWN
            echo Neither backend nor frontend is running
        )
    )
)

echo.
echo ===============================================================
echo   Monitoring
echo ===============================================================
echo.
echo Services are running in separate windows.
echo Press any key to open frontend in browser, or Ctrl+C to exit...
pause >nul

REM Open frontend in browser
start http://localhost:%FRONTEND_PORT%

echo.
echo To stop services, close the backend and frontend windows.
echo.

:cleanup
exit /b 0
