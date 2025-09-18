@echo off
echo ======================================
echo    TRACE MACHINE API CALLS - SIMPLE
echo ======================================
echo.
echo This will show what HTTP requests the machine makes
echo.

echo Testing if machine can reach different URL patterns...
echo.

echo 1. Testing /api/motong/deviceOrderQueueList:
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"1\"}" http://192.168.10.2:3000/api/motong/deviceOrderQueueList | findstr "code\|msg" 2>nul
echo.

echo 2. Testing /swoft/api/motong/deviceOrderQueueList:
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"1\"}" http://192.168.10.2:3000/swoft/api/motong/deviceOrderQueueList | findstr "code\|msg" 2>nul
echo.

echo 3. Testing different ports (8080, 80):
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"1\"}" http://192.168.10.2:8080/api/motong/deviceOrderQueueList --connect-timeout 3 | findstr "code\|msg" 2>nul
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"1\"}" http://192.168.10.2:80/api/motong/deviceOrderQueueList --connect-timeout 3 | findstr "code\|msg" 2>nul
echo.

echo 4. Checking what the machine process might be calling...
echo Looking for Java/Coffee processes:
tasklist /fi "imagename eq java*" 2>nul
tasklist /fi "imagename eq *coffee*" 2>nul
tasklist /fi "imagename eq *motong*" 2>nul
echo.

echo 5. Monitoring network activity for 30 seconds...
echo Watch for any connections to port 3000...
for /L %%i in (1,1,6) do (
    echo [%%i/6] Checking connections...
    netstat -an | findstr "192.168.10.2:3000" 
    timeout /t 5 /nobreak >nul
)

echo.
echo ======================================
echo Monitoring complete!
echo If you see connections above, the machine IS trying to connect.
echo If not, the machine might be configured for a different server.
echo ======================================
pause
