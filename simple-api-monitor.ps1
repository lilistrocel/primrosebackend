# Simple API Call Monitor for Coffee Machine
# Copy this file to the coffee machine PC and run in PowerShell

Write-Host "======================================" -ForegroundColor Green
Write-Host "    COFFEE MACHINE API MONITOR       " -ForegroundColor Green  
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Monitoring outbound API calls..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Function to check what this machine is trying to connect to
function Check-Connections {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Checking connections..." -ForegroundColor Cyan
    
    # Look for connections to port 3000 (our backend) or common web ports
    $connections = netstat -an | Select-String "192\.168\.|127\.0\.0\.1|localhost" | Select-String ":3000\s|:80\s|:443\s|:8080\s"
    
    if ($connections) {
        Write-Host "FOUND CONNECTIONS:" -ForegroundColor Green
        foreach ($conn in $connections) {
            Write-Host "  $conn" -ForegroundColor White
        }
    } else {
        Write-Host "No connections to backend servers found" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Function to test if machine can reach our backend
function Test-Backend {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Testing backend connectivity..." -ForegroundColor Cyan
    
    # Test the main endpoint the machine should call
    try {
        $body = '{"deviceId":"1"}'
        $response = Invoke-RestMethod -Uri "http://192.168.10.2:3000/api/motong/deviceOrderQueueList" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 3
        Write-Host "✅ Backend is reachable!" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Cannot reach backend: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Function to look for coffee-related processes
function Check-Processes {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Looking for coffee machine processes..." -ForegroundColor Cyan
    
    # Common process names for coffee machines
    $keywords = @("coffee", "java", "motong", "kiosk", "pos", "payment", "service")
    
    foreach ($keyword in $keywords) {
        $processes = Get-Process | Where-Object { $_.ProcessName -like "*$keyword*" }
        if ($processes) {
            Write-Host "Found processes with '$keyword':" -ForegroundColor Green
            foreach ($proc in $processes) {
                Write-Host "  $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor White
            }
        }
    }
    Write-Host ""
}

# Function to check network interfaces and IPs
function Check-NetworkInfo {
    Write-Host "NETWORK INFORMATION:" -ForegroundColor Green
    
    # Get IP addresses
    $adapters = Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.IPAddress -ne "127.0.0.1" }
    
    Write-Host "Machine IP Addresses:" -ForegroundColor Yellow
    foreach ($adapter in $adapters) {
        Write-Host "  $($adapter.IPAddress)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Expected backend IP: 192.168.10.2:3000" -ForegroundColor Yellow
    Write-Host ""
}

# Show network info once at startup
Check-NetworkInfo

# Main monitoring loop
$scanCount = 0
while ($true) {
    $scanCount++
    
    Write-Host "=== SCAN #$scanCount ===" -ForegroundColor Magenta
    
    Check-Connections
    Check-Processes
    
    # Test backend every 3rd scan
    if ($scanCount % 3 -eq 0) {
        Test-Backend
    }
    
    Write-Host "Waiting 15 seconds for next scan..." -ForegroundColor Gray
    Write-Host ""
    Start-Sleep -Seconds 15
}
