@echo off
echo ======================================
echo   QUICK COFFEE MACHINE NETWORK CHECK
echo ======================================
echo.

echo Current machine IP addresses:
ipconfig | findstr /i "IPv4"
echo.

echo Testing connection to backend...
ping -n 3 192.168.10.2
echo.

echo Checking active network connections:
netstat -an | findstr "192.168\|127.0.0.1\|localhost" | findstr ":3000\|:80\|:443"
echo.

echo Looking for coffee-related processes:
tasklist | findstr /i "coffee\|java\|motong\|kiosk"
echo.

echo Testing backend API:
echo {"deviceId":"1"} > temp_test.json
curl -X POST -H "Content-Type: application/json" -d @temp_test.json http://192.168.10.2:3000/api/motong/deviceOrderQueueList 2>nul
del temp_test.json 2>nul
echo.

echo ======================================
echo Check complete! Press any key to exit.
pause >nul
