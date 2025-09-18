# Test Coffee Machine Network Connectivity
# Tests if the coffee machine can be reached and if it can reach us

param(
    [string]$MachineIP = "192.168.10.6",  # Your machine's IP from config
    [string]$BackendIP = "192.168.10.2",  # Your backend IP
    [int]$BackendPort = 3000
)

Write-Host "🔍 COFFEE MACHINE CONNECTIVITY TEST" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Test 1: Can we reach the machine?
Write-Host "📡 Test 1: Pinging coffee machine at $MachineIP..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $MachineIP -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "  ✅ Coffee machine is reachable!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Coffee machine is not responding to ping" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error pinging machine: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Is our backend accessible from network?
Write-Host "📡 Test 2: Testing backend accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://$BackendIP`:$BackendPort/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "OK") {
        Write-Host "  ✅ Backend is accessible on network!" -ForegroundColor Green
        Write-Host "    Service: $($response.service)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Backend not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test the exact machine endpoint
Write-Host "📡 Test 3: Testing machine's configured endpoint..." -ForegroundColor Yellow
$machineEndpoint = "http://$BackendIP`:$BackendPort/api/motong/deviceOrderQueueList"
Write-Host "  Endpoint: $machineEndpoint" -ForegroundColor Gray

try {
    $testData = @{ deviceId = "1" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $machineEndpoint -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 5
    
    if ($response.code -eq 0) {
        Write-Host "  ✅ Machine endpoint is working!" -ForegroundColor Green
        Write-Host "    Found $($response.data.Count) orders" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  Endpoint responded but with error code: $($response.code)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Machine endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check if machine is trying to connect
Write-Host "📡 Test 4: Checking for recent connections from machine..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort $BackendPort -RemoteAddress $MachineIP -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "  ✅ Found connections from machine IP!" -ForegroundColor Green
    foreach ($conn in $connections) {
        Write-Host "    $($conn.RemoteAddress):$($conn.RemotePort) -> $($conn.LocalAddress):$($conn.LocalPort) ($($conn.State))" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ No recent connections from machine IP detected" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 RECOMMENDATIONS:" -ForegroundColor Yellow

if ($pingResult) {
    Write-Host "• Machine is reachable - network connectivity is good" -ForegroundColor Green
} else {
    Write-Host "• Check if machine IP ($MachineIP) is correct" -ForegroundColor Red
    Write-Host "• Verify machine and computer are on same network" -ForegroundColor Red
}

Write-Host "• Make sure machine is configured to call: http://$BackendIP`:$BackendPort/api/motong/" -ForegroundColor Cyan
Write-Host "• Check machine logs for any error messages" -ForegroundColor Cyan
Write-Host "• Try restarting the machine software/service" -ForegroundColor Cyan
