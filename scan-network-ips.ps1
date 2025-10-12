# Network IP Scanner for Windows
# Scans the local network for all available IP addresses
# Usage: .\scan-network-ips.ps1 [subnet] [timeout]

param(
    [string]$Subnet = "",
    [int]$Timeout = 1000,
    [int]$Threads = 50
)

Write-Host "🔍 NETWORK IP SCANNER" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""

# Function to get current network info
function Get-NetworkInfo {
    Write-Host "📊 Current Network Configuration:" -ForegroundColor Yellow
    
    # Get all IPv4 addresses
    $adapters = Get-NetIPAddress | Where-Object { 
        $_.AddressFamily -eq "IPv4" -and 
        $_.IPAddress -ne "127.0.0.1" -and 
        $_.PrefixOrigin -ne "WellKnown" 
    }
    
    foreach ($adapter in $adapters) {
        $interface = Get-NetAdapter | Where-Object { $_.InterfaceIndex -eq $adapter.InterfaceIndex }
        Write-Host "  🌐 $($adapter.IPAddress) ($($interface.Name))" -ForegroundColor White
    }
    
    Write-Host ""
    return $adapters
}

# Function to calculate subnet from IP and mask
function Get-SubnetRange {
    param([string]$IP, [int]$PrefixLength)
    
    $ipBytes = [System.Net.IPAddress]::Parse($IP).GetAddressBytes()
    $maskBytes = [System.Net.IPAddress]::Parse([System.Net.IPAddress]::new([uint32]::MaxValue -shl (32 - $PrefixLength))).GetAddressBytes()
    
    $networkBytes = @()
    for ($i = 0; $i -lt 4; $i++) {
        $networkBytes += $ipBytes[$i] -band $maskBytes[$i]
    }
    
    $networkIP = [System.Net.IPAddress]::new($networkBytes)
    $hostBits = 32 - $PrefixLength
    $hostCount = [Math]::Pow(2, $hostBits) - 2  # Exclude network and broadcast
    
    return @{
        Network = $networkIP.ToString()
        HostCount = $hostCount
        StartIP = $networkIP.ToString()
    }
}

# Function to ping a single IP
function Test-IPAddress {
    param([string]$IP, [int]$Timeout)
    
    try {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $result = $ping.Send($IP, $Timeout)
        
        if ($result.Status -eq "Success") {
            # Try to get hostname
            try {
                $hostname = [System.Net.Dns]::GetHostByAddress($IP).HostName
            } catch {
                $hostname = "Unknown"
            }
            
            # Try to get MAC address (requires ARP table)
            $macAddress = ""
            try {
                $arpResult = arp -a | Select-String $IP
                if ($arpResult) {
                    $macAddress = ($arpResult.ToString() -split '\s+')[1]
                }
            } catch {
                $macAddress = "Unknown"
            }
            
            return @{
                IP = $IP
                Status = "Online"
                Hostname = $hostname
                MAC = $macAddress
                ResponseTime = $result.RoundtripTime
            }
        }
    } catch {
        # Silently continue on error
    }
    
    return $null
}

# Function to scan a range of IPs
function Scan-IPRange {
    param([string]$StartIP, [int]$Count, [int]$Timeout, [int]$Threads)
    
    Write-Host "🔍 Scanning $Count IP addresses..." -ForegroundColor Yellow
    Write-Host "⏱️  Timeout: ${Timeout}ms | Threads: $Threads" -ForegroundColor Gray
    Write-Host ""
    
    $results = @()
    $jobs = @()
    $batchSize = [Math]::Ceiling($Count / $Threads)
    
    # Create IP addresses to scan
    $ipParts = $StartIP.Split('.')
    $baseIP = "$($ipParts[0]).$($ipParts[1]).$($ipParts[2])"
    $startHost = [int]$ipParts[3]
    
    $ipList = @()
    for ($i = 1; $i -le $Count; $i++) {
        $hostNum = $startHost + $i
        if ($hostNum -le 254) {
            $ipList += "$baseIP.$hostNum"
        }
    }
    
    # Process in batches
    $batches = @()
    for ($i = 0; $i -lt $ipList.Count; $i += $batchSize) {
        $batch = $ipList[$i..([Math]::Min($i + $batchSize - 1, $ipList.Count - 1))]
        $batches += ,$batch
    }
    
    # Start background jobs for each batch
    foreach ($batch in $batches) {
        $job = Start-Job -ScriptBlock {
            param($IPs, $Timeout)
            $batchResults = @()
            foreach ($ip in $IPs) {
                $result = Test-IPAddress -IP $ip -Timeout $Timeout
                if ($result) {
                    $batchResults += $result
                }
            }
            return $batchResults
        } -ArgumentList $batch, $Timeout
        
        $jobs += $job
    }
    
    # Wait for all jobs to complete and collect results
    Write-Host "⏳ Scanning in progress..." -ForegroundColor Cyan
    $completed = 0
    $total = $jobs.Count
    
    while ($jobs.Count -gt 0) {
        $completedJobs = $jobs | Where-Object { $_.State -eq "Completed" }
        
        foreach ($job in $completedJobs) {
            $jobResults = Receive-Job -Job $job
            if ($jobResults) {
                $results += $jobResults
            }
            Remove-Job -Job $job
            $jobs = $jobs | Where-Object { $_ -ne $job }
            $completed++
        }
        
        $progress = [Math]::Round(($completed / $total) * 100)
        Write-Progress -Activity "Scanning Network" -Status "Progress: $completed/$total batches" -PercentComplete $progress
        
        Start-Sleep -Milliseconds 100
    }
    
    Write-Progress -Activity "Scanning Network" -Completed
    return $results
}

# Main execution
try {
    # Get current network info
    $adapters = Get-NetworkInfo
    
    # Determine subnet to scan
    if ($Subnet -eq "") {
        # Auto-detect the most likely subnet
        $mainAdapter = $adapters | Where-Object { 
            $_.IPAddress -match "192\.168\." -or 
            $_.IPAddress -match "10\." -or 
            $_.IPAddress -match "172\." 
        } | Select-Object -First 1
        
        if ($mainAdapter) {
            $Subnet = $mainAdapter.IPAddress
            $prefixLength = $mainAdapter.PrefixLength
            Write-Host "🎯 Auto-detected subnet: $Subnet/$prefixLength" -ForegroundColor Green
        } else {
            Write-Host "❌ Could not auto-detect subnet. Please specify manually." -ForegroundColor Red
            Write-Host "Usage: .\scan-network-ips.ps1 -Subnet '192.168.1.1' -Timeout 1000" -ForegroundColor Yellow
            exit 1
        }
    } else {
        $prefixLength = 24  # Default to /24
        Write-Host "🎯 Using specified subnet: $Subnet/$prefixLength" -ForegroundColor Green
    }
    
    # Calculate scan range
    $subnetInfo = Get-SubnetRange -IP $Subnet -PrefixLength $prefixLength
    $scanCount = [Math]::Min($subnetInfo.HostCount, 254)  # Limit to reasonable range
    
    Write-Host ""
    Write-Host "🚀 Starting scan of $scanCount IP addresses..." -ForegroundColor Green
    Write-Host ""
    
    # Perform the scan
    $results = Scan-IPRange -StartIP $subnetInfo.StartIP -Count $scanCount -Timeout $Timeout -Threads $Threads
    
    # Display results
    Write-Host ""
    Write-Host "📋 SCAN RESULTS" -ForegroundColor Green
    Write-Host "===============" -ForegroundColor Green
    Write-Host ""
    
    if ($results.Count -gt 0) {
        Write-Host "✅ Found $($results.Count) active devices:" -ForegroundColor Green
        Write-Host ""
        
        # Sort results by IP
        $sortedResults = $results | Sort-Object { [System.Net.IPAddress]::Parse($_.IP) }
        
        foreach ($result in $sortedResults) {
            $status = "🟢 ONLINE"
            $color = "Green"
            
            # Check if it might be a coffee machine (based on your project context)
            $isCoffeeMachine = $result.IP -match "192\.168\.10\." -or $result.Hostname -match "coffee\|machine\|motong"
            if ($isCoffeeMachine) {
                $status = "☕ COFFEE MACHINE"
                $color = "Magenta"
            }
            
            Write-Host "  $status" -ForegroundColor $color -NoNewline
            Write-Host " - $($result.IP)" -ForegroundColor White -NoNewline
            Write-Host " ($($result.Hostname))" -ForegroundColor Gray -NoNewline
            Write-Host " [${$result.ResponseTime}ms]" -ForegroundColor Yellow -NoNewline
            if ($result.MAC -ne "Unknown") {
                Write-Host " MAC: $($result.MAC)" -ForegroundColor Cyan
            } else {
                Write-Host ""
            }
        }
        
        Write-Host ""
        Write-Host "💡 TIP: Coffee machines typically use 192.168.10.x range" -ForegroundColor Yellow
        Write-Host "🔧 Use 'ping <IP>' to test connectivity" -ForegroundColor Yellow
        Write-Host "🌐 Use 'nslookup <IP>' to get more hostname info" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ No active devices found on the network" -ForegroundColor Red
        Write-Host "💡 Try:" -ForegroundColor Yellow
        Write-Host "   - Check if you're on the right network" -ForegroundColor Gray
        Write-Host "   - Increase timeout: .\scan-network-ips.ps1 -Timeout 2000" -ForegroundColor Gray
        Write-Host "   - Check firewall settings" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error during scan: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure you're running as Administrator for best results" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏁 Scan complete! Press any key to exit." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

