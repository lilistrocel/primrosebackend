# Coffee Machine Network Traffic Monitor
# Run this script on the coffee machine's Windows PC to see outbound API calls

Write-Host "==========================================" -ForegroundColor Green
Write-Host "  COFFEE MACHINE TRAFFIC MONITOR v1.0   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will monitor outbound HTTP/API calls from this machine" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host ""

# Function to get network connections
function Get-NetworkConnections {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking active network connections..." -ForegroundColor Cyan
    
    # Get all TCP connections from this machine
    $connections = Get-NetTCPConnection | Where-Object { 
        $_.State -eq "Established" -and 
        ($_.RemotePort -eq 3000 -or $_.RemotePort -eq 80 -or $_.RemotePort -eq 443 -or $_.RemotePort -eq 8080)
    }
    
    if ($connections) {
        Write-Host "ACTIVE CONNECTIONS TO WEB SERVERS:" -ForegroundColor Green
        foreach ($conn in $connections) {
            $remoteIP = $conn.RemoteAddress
            $remotePort = $conn.RemotePort
            $localPort = $conn.LocalPort
            
            Write-Host "  -> $remoteIP:$remotePort (from local port $localPort)" -ForegroundColor White
            
            # Try to resolve hostname
            try {
                $hostname = [System.Net.Dns]::GetHostByAddress($remoteIP).HostName
                Write-Host "     Hostname: $hostname" -ForegroundColor Gray
            } catch {
                Write-Host "     Hostname: Could not resolve" -ForegroundColor Gray
            }
        }
        Write-Host ""
    } else {
        Write-Host "No active connections to web servers found" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Function to monitor processes making network calls
function Get-NetworkProcesses {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking processes with network activity..." -ForegroundColor Cyan
    
    # Get processes that might be making HTTP calls
    $networkProcesses = Get-Process | Where-Object {
        $_.ProcessName -like "*coffee*" -or 
        $_.ProcessName -like "*java*" -or 
        $_.ProcessName -like "*http*" -or
        $_.ProcessName -like "*curl*" -or
        $_.ProcessName -like "*wget*" -or
        $_.ProcessName -eq "python" -or
        $_.ProcessName -eq "node"
    }
    
    if ($networkProcesses) {
        Write-Host "POTENTIAL API CLIENT PROCESSES:" -ForegroundColor Green
        foreach ($proc in $networkProcesses) {
            Write-Host "  Process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor White
            
            # Try to get command line (requires admin rights)
            try {
                $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                if ($cmdLine) {
                    Write-Host "    Command: $cmdLine" -ForegroundColor Gray
                }
            } catch {
                Write-Host "    Command: Access denied (need admin rights)" -ForegroundColor Gray
            }
        }
        Write-Host ""
    }
}

# Function to check specific URLs
function Test-BackendConnectivity {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Testing backend connectivity..." -ForegroundColor Cyan
    
    $testUrls = @(
        "http://192.168.10.2:3000/api/motong/deviceOrderQueueList",
        "http://localhost:3000/api/motong/deviceOrderQueueList",
        "http://127.0.0.1:3000/api/motong/deviceOrderQueueList"
    )
    
    foreach ($url in $testUrls) {
        try {
            Write-Host "Testing: $url" -ForegroundColor White
            $response = Invoke-WebRequest -Uri $url -Method POST -Body '{"deviceId":"1"}' -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "  ✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ FAILED - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Function to monitor HTTP traffic using netstat
function Monitor-HTTPTraffic {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Monitoring HTTP traffic with netstat..." -ForegroundColor Cyan
    
    # Run netstat to show active connections
    $netstatOutput = netstat -an | Select-String ":80\s|:443\s|:3000\s|:8080\s"
    
    if ($netstatOutput) {
        Write-Host "HTTP/API CONNECTIONS:" -ForegroundColor Green
        foreach ($line in $netstatOutput) {
            Write-Host "  $line" -ForegroundColor White
        }
    } else {
        Write-Host "No HTTP connections found" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Function to capture network packets (if available)
function Start-PacketCapture {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Attempting to capture HTTP packets..." -ForegroundColor Cyan
    
    # Check if we can use netsh to trace
    try {
        Write-Host "Starting network trace (requires admin rights)..." -ForegroundColor Yellow
        Write-Host "This will create a trace file to analyze HTTP requests" -ForegroundColor Gray
        
        # Start a trace for HTTP traffic
        $traceCmd = "netsh trace start capture=yes tracefile=coffee-traffic.etl provider=Microsoft-Windows-TCPIP level=4"
        Write-Host "Command to run: $traceCmd" -ForegroundColor Gray
        Write-Host "Run this command in an admin PowerShell window if needed" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Cannot start packet capture without admin rights" -ForegroundColor Red
    }
    Write-Host ""
}

# Main monitoring loop
Write-Host "Starting continuous monitoring..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

$counter = 0
while ($true) {
    $counter++
    Write-Host ""
    Write-Host "=== SCAN #$counter at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Magenta
    
    # Run all monitoring functions
    Get-NetworkConnections
    Get-NetworkProcesses
    Monitor-HTTPTraffic
    
    # Test connectivity every 5th scan
    if ($counter % 5 -eq 0) {
        Test-BackendConnectivity
    }
    
    # Show packet capture info once
    if ($counter -eq 1) {
        Start-PacketCapture
    }
    
    Write-Host "Next scan in 10 seconds... (Press Ctrl+C to stop)" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}
