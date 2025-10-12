# Advanced Network Scanner with Service Detection
# Scans network for IPs and detects common services
# Usage: .\scan-network-advanced.ps1

param(
    [string]$Subnet = "",
    [int]$Timeout = 1000,
    [switch]$DetectServices = $true,
    [switch]$ExportResults = $false,
    [string]$OutputFile = "network-scan-results.csv"
)

Write-Host "ADVANCED NETWORK SCANNER" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Common service ports to check
$CommonPorts = @{
    22 = "SSH"
    23 = "Telnet"
    80 = "HTTP"
    443 = "HTTPS"
    3000 = "Node.js/API"
    3001 = "React Dev Server"
    3002 = "Mock Service"
    8080 = "HTTP Alt"
    8443 = "HTTPS Alt"
    3389 = "RDP"
    21 = "FTP"
    25 = "SMTP"
    53 = "DNS"
    110 = "POP3"
    143 = "IMAP"
    993 = "IMAPS"
    995 = "POP3S"
    3306 = "MySQL"
    5432 = "PostgreSQL"
    6379 = "Redis"
    27017 = "MongoDB"
}

# Function to test if a port is open
function Test-Port {
    param([string]$IP, [int]$Port, [int]$Timeout)
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect($IP, $Port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne($Timeout, $false)
        
        if ($wait) {
            $tcpClient.EndConnect($connect)
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    } catch {
        return $false
    }
}

# Function to get detailed device info
function Get-DeviceInfo {
    param([string]$IP)
    
    $info = @{
        IP = $IP
        Hostname = "Unknown"
        MAC = "Unknown"
        OpenPorts = @()
        Services = @()
        ResponseTime = 0
        LastSeen = Get-Date
    }
    
    try {
        # Get hostname
        $dnsResult = [System.Net.Dns]::GetHostByAddress($IP)
        $info.Hostname = $dnsResult.HostName
    } catch {
        # Hostname not found, that's okay
    }
    
    # Get MAC address from ARP table
    try {
        $arpResult = arp -a | Select-String $IP
        if ($arpResult) {
            $info.MAC = ($arpResult.ToString() -split '\s+')[1]
        }
    } catch {
        # MAC not found in ARP table
    }
    
    # Test common ports if service detection is enabled
    if ($DetectServices) {
        Write-Host "  Scanning services on $IP..." -ForegroundColor Gray
        
        foreach ($port in $CommonPorts.Keys) {
            if (Test-Port -IP $IP -Port $port -Timeout 500) {
                $info.OpenPorts += $port
                $info.Services += $CommonPorts[$port]
            }
        }
    }
    
    return $info
}

# Function to scan network range
function Scan-NetworkRange {
    param([string]$StartIP, [int]$Count)
    
    Write-Host "Scanning $Count IP addresses for devices and services..." -ForegroundColor Yellow
    Write-Host ""
    
    $results = @()
    $ipParts = $StartIP.Split('.')
    $baseIP = "$($ipParts[0]).$($ipParts[1]).$($ipParts[2])"
    
    for ($i = 1; $i -le $Count; $i++) {
        $ip = "$baseIP.$i"
        
        # Quick ping test first
        $ping = New-Object System.Net.NetworkInformation.Ping
        $pingResult = $ping.Send($ip, $Timeout)
        
        if ($pingResult.Status -eq "Success") {
            Write-Host "Found device: $ip" -ForegroundColor Green
            $deviceInfo = Get-DeviceInfo -IP $ip
            $deviceInfo.ResponseTime = $pingResult.RoundtripTime
            $results += $deviceInfo
        }
    }
    
    return $results
}

# Function to export results
function Export-ScanResults {
    param([array]$Results, [string]$FilePath)
    
    $csvData = @()
    foreach ($result in $Results) {
        $csvData += [PSCustomObject]@{
            IP = $result.IP
            Hostname = $result.Hostname
            MAC = $result.MAC
            ResponseTime = $result.ResponseTime
            OpenPorts = ($result.OpenPorts -join ";")
            Services = ($result.Services -join ";")
            LastSeen = $result.LastSeen
        }
    }
    
    $csvData | Export-Csv -Path $FilePath -NoTypeInformation
    Write-Host "Results exported to: $FilePath" -ForegroundColor Green
}

# Main execution
try {
    # Get current network configuration
    Write-Host "Current Network Configuration:" -ForegroundColor Yellow
    $adapters = Get-NetIPAddress | Where-Object { 
        $_.AddressFamily -eq "IPv4" -and 
        $_.IPAddress -ne "127.0.0.1" 
    }
    
    foreach ($adapter in $adapters) {
        $interface = Get-NetAdapter | Where-Object { $_.InterfaceIndex -eq $adapter.InterfaceIndex }
        Write-Host "  $($adapter.IPAddress) ($($interface.Name))" -ForegroundColor White
    }
    
    Write-Host ""
    
    # Determine subnet to scan
    if ($Subnet -eq "") {
        $mainAdapter = $adapters | Where-Object { 
            $_.IPAddress -match "192\.168\." -or 
            $_.IPAddress -match "10\." -or 
            $_.IPAddress -match "172\." 
        } | Select-Object -First 1
        
        if ($mainAdapter) {
            $Subnet = $mainAdapter.IPAddress
            Write-Host "Auto-detected subnet: $Subnet" -ForegroundColor Green
        } else {
            Write-Host "Could not auto-detect subnet. Please specify manually." -ForegroundColor Red
            Write-Host "Usage: .\scan-network-advanced.ps1 -Subnet '192.168.1.1'" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Extract base subnet (assume /24)
    $ipParts = $Subnet.Split('.')
    $baseSubnet = "$($ipParts[0]).$($ipParts[1]).$($ipParts[2])"
    
    Write-Host "Starting advanced scan of $baseSubnet.x..." -ForegroundColor Green
    Write-Host ""
    
    # Perform the scan
    $results = Scan-NetworkRange -StartIP "$baseSubnet.1" -Count 254
    
    # Display results
    Write-Host ""
    Write-Host "SCAN RESULTS" -ForegroundColor Green
    Write-Host "============" -ForegroundColor Green
    Write-Host ""
    
    if ($results.Count -gt 0) {
        Write-Host "Found $($results.Count) active devices:" -ForegroundColor Green
        Write-Host ""
        
        # Sort by IP
        $sortedResults = $results | Sort-Object { [System.Net.IPAddress]::Parse($_.IP) }
        
        foreach ($result in $sortedResults) {
            # Determine device type
            $deviceType = "Computer"
            $color = "White"
            
            if ($result.IP -match "192\.168\.10\.") {
                $deviceType = "Coffee Machine"
                $color = "Magenta"
            } elseif ($result.OpenPorts -contains 3000) {
                $deviceType = "API Server"
                $color = "Cyan"
            } elseif ($result.OpenPorts -contains 80 -or $result.OpenPorts -contains 443) {
                $deviceType = "Web Server"
                $color = "Blue"
            } elseif ($result.OpenPorts -contains 22) {
                $deviceType = "Linux Server"
                $color = "Green"
            } elseif ($result.OpenPorts -contains 3389) {
                $deviceType = "Windows Server"
                $color = "Yellow"
            }
            
            Write-Host "  $deviceType" -ForegroundColor $color -NoNewline
            Write-Host " - $($result.IP)" -ForegroundColor White -NoNewline
            Write-Host " ($($result.Hostname))" -ForegroundColor Gray -NoNewline
            Write-Host " [${$result.ResponseTime}ms]" -ForegroundColor Yellow
            
            if ($result.MAC -ne "Unknown") {
                Write-Host "    MAC: $($result.MAC)" -ForegroundColor Cyan
            }
            
            if ($result.OpenPorts.Count -gt 0) {
                Write-Host "    Open Ports: $($result.OpenPorts -join ', ')" -ForegroundColor Yellow
                Write-Host "    Services: $($result.Services -join ', ')" -ForegroundColor Gray
            }
            
            Write-Host ""
        }
        
        # Export results if requested
        if ($ExportResults) {
            Export-ScanResults -Results $results -FilePath $OutputFile
        }
        
        Write-Host "TIP: Use 'telnet IP PORT' to test specific services" -ForegroundColor Yellow
        Write-Host "Coffee machines typically use 192.168.10.x range" -ForegroundColor Yellow
        
    } else {
        Write-Host "No active devices found on the network" -ForegroundColor Red
        Write-Host "Try:" -ForegroundColor Yellow
        Write-Host "   - Check if you're on the right network" -ForegroundColor Gray
        Write-Host "   - Increase timeout: .\scan-network-advanced.ps1 -Timeout 2000" -ForegroundColor Gray
        Write-Host "   - Check firewall settings" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Error during scan: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Advanced scan complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  .\scan-network-advanced.ps1 -DetectServices" -ForegroundColor Gray
Write-Host "  .\scan-network-advanced.ps1 -ExportResults -OutputFile 'my-scan.csv'" -ForegroundColor Gray
Write-Host "  .\scan-network-advanced.ps1 -Subnet '192.168.1.1' -Timeout 2000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")