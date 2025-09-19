@echo off
echo ========================================
echo     K2 Coffee Machine - Internet Tunnel
echo ========================================
echo.
echo Choose your tunnel service:
echo 1. Ngrok (Recommended - requires account)
echo 2. LocalTunnel (Simple - no account needed)
echo 3. Cloudflare (Professional - requires setup)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo Starting with Ngrok...
    powershell -ExecutionPolicy Bypass -File start-with-tunnel.ps1 -TunnelService ngrok
) else if "%choice%"=="2" (
    echo Starting with LocalTunnel...
    powershell -ExecutionPolicy Bypass -File start-with-tunnel.ps1 -TunnelService localtunnel
) else if "%choice%"=="3" (
    echo Starting with Cloudflare...
    powershell -ExecutionPolicy Bypass -File start-with-tunnel.ps1 -TunnelService cloudflare
) else (
    echo Invalid choice. Using Ngrok by default...
    powershell -ExecutionPolicy Bypass -File start-with-tunnel.ps1 -TunnelService ngrok
)

pause
