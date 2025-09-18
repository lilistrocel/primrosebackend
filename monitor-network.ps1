# Network Traffic Monitor for Coffee Machine Backend
# Monitors all connections to port 3000 and tracks machine activity

param(
    [int]$Port = 3000,
    [int]$RefreshSeconds = 2
)

Write-Host "🔍 COFFEE MACHINE NETWORK MONITOR" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitoring port $Port for coffee machine traffic..." -ForegroundColor Yellow
Write-Host "🔄 Refresh every $RefreshSeconds seconds" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host ""

$iteration = 0

try {
    while ($true) {
        $iteration++
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        Write-Host "[$iteration] $timestamp - Network Connections to Port $Port:" -ForegroundColor Cyan
        
        # Get all TCP connections to port 3000
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($conn in $connections) {
                $remoteIP = $conn.RemoteAddress
                $state = $conn.State
                $remotePort = $conn.RemotePort
                
                # Check if this looks like a machine IP
                $isMachineIP = $remoteIP -match "192\.168\.10\." -or $remoteIP -match "192\.168\."
                $status = if ($isMachineIP) { "🤖 POTENTIAL MACHINE" } else { "🌐 Other Device" }
                
                Write-Host "  📡 $status - $remoteIP`:$remotePort ($state)" -ForegroundColor $(if ($isMachineIP) { "Green" } else { "White" })
            }
        } else {
            Write-Host "  📭 No active connections to port $Port" -ForegroundColor Gray
        }
        
        # Check for any processes listening on port 3000
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($listeners) {
            Write-Host "  👂 Backend is listening on port $Port" -ForegroundColor Green
        } else {
            Write-Host "  ❌ No process listening on port $Port!" -ForegroundColor Red
        }
        
        Write-Host ""
        Start-Sleep -Seconds $RefreshSeconds
    }
} catch {
    Write-Host "Monitoring stopped by user" -ForegroundColor Yellow
}
