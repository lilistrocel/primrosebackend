# Network Scanning Guide

This guide provides multiple methods to scan your LAN for all available IP addresses and devices.

## Quick Start

### 🚀 Method 1: Simple Batch Scanner (Fastest)
```cmd
scan-network-simple.cmd
```
- **Best for**: Quick overview of active devices
- **Speed**: Very fast
- **Features**: Basic ping scan, hostname resolution
- **Requirements**: Windows Command Prompt

### 🔍 Method 2: PowerShell Network Scanner (Recommended)
```powershell
.\scan-network-ips.ps1
```
- **Best for**: Comprehensive network discovery
- **Speed**: Fast with threading
- **Features**: Auto-detects subnet, shows hostnames, MAC addresses, response times
- **Requirements**: PowerShell (Windows 10+)

### 🛠️ Method 3: Advanced Service Scanner
```powershell
.\scan-network-advanced.ps1 -DetectServices
```
- **Best for**: Detailed device analysis
- **Speed**: Slower (scans ports)
- **Features**: Service detection, port scanning, CSV export
- **Requirements**: PowerShell (Windows 10+)

## Usage Examples

### Basic Network Scan
```cmd
# Simple scan
scan-network-simple.cmd

# PowerShell scan with custom timeout
.\scan-network-ips.ps1 -Timeout 2000

# Advanced scan with service detection
.\scan-network-advanced.ps1 -DetectServices -ExportResults
```

### Custom Subnet Scanning
```powershell
# Scan specific subnet
.\scan-network-ips.ps1 -Subnet "192.168.1.1"

# Scan with more threads for faster results
.\scan-network-ips.ps1 -Threads 100

# Advanced scan with custom output
.\scan-network-advanced.ps1 -Subnet "10.0.0.1" -OutputFile "office-network.csv"
```

## Understanding Results

### Device Types Detected
- **☕ Coffee Machine**: Devices in 192.168.10.x range (your coffee machine network)
- **🔧 API Server**: Devices with port 3000 open (your backend)
- **🌐 Web Server**: Devices with HTTP/HTTPS ports
- **🖥️ Computer**: General network devices
- **🐧 Linux Server**: Devices with SSH (port 22)
- **🖥️ Windows Server**: Devices with RDP (port 3389)

### Common Network Ranges
- **192.168.1.x**: Most home routers
- **192.168.0.x**: Some home routers
- **192.168.10.x**: Your coffee machine network
- **10.0.0.x**: Corporate networks
- **172.16.x.x**: Corporate networks

## Troubleshooting

### "No devices found"
1. **Check network connection**: Are you on the right network?
2. **Increase timeout**: Use `-Timeout 2000` for slower networks
3. **Check firewall**: Windows Firewall might block ping
4. **Run as Administrator**: For best results

### "Permission denied"
```cmd
# Run Command Prompt as Administrator
# Right-click Command Prompt → "Run as administrator"
```

### "Script execution disabled"
```powershell
# Enable PowerShell script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Coffee Machine Specific

### Finding Your Coffee Machine
```powershell
# Scan specifically for coffee machine network
.\scan-network-ips.ps1 -Subnet "192.168.10.1"

# Look for devices with these characteristics:
# - IP in 192.168.10.x range
# - Hostname containing "coffee", "machine", or "motong"
# - Port 3000 open (if running backend)
```

### Testing Coffee Machine Connection
```cmd
# Test if coffee machine is reachable
ping 192.168.10.6

# Test if backend API is responding
curl http://192.168.10.6:3000/api/motong/deviceOrderQueueList
```

## Advanced Usage

### Export Results
```powershell
# Export to CSV for analysis
.\scan-network-advanced.ps1 -ExportResults -OutputFile "network-scan.csv"

# Import results in Excel or other tools
Import-Csv "network-scan.csv"
```

### Scheduled Scanning
```powershell
# Create a scheduled task to scan network daily
# Task Scheduler → Create Basic Task → PowerShell script
```

### Network Monitoring
```powershell
# Monitor network changes over time
while ($true) {
    .\scan-network-ips.ps1
    Start-Sleep -Seconds 300  # Scan every 5 minutes
}
```

## Integration with Existing Tools

### Using with Your Coffee Machine System
```powershell
# Scan for coffee machines and update configuration
$results = .\scan-network-ips.ps1
$coffeeMachines = $results | Where-Object { $_.IP -match "192\.168\.10\." }

foreach ($machine in $coffeeMachines) {
    Write-Host "Found coffee machine: $($machine.IP)"
    # Update your configuration files here
}
```

### Combining with Network Monitor
```powershell
# Use alongside your existing monitor-network.ps1
.\monitor-network.ps1 -Port 3000
# In another window:
.\scan-network-ips.ps1
```

## Performance Tips

### Faster Scanning
- Use more threads: `-Threads 100`
- Reduce timeout: `-Timeout 500`
- Scan smaller ranges: Focus on likely subnets

### Slower but More Accurate
- Increase timeout: `-Timeout 3000`
- Enable service detection: `-DetectServices`
- Use advanced scanner: `.\scan-network-advanced.ps1`

## Security Notes

- **Only scan your own network**: Don't scan networks you don't own
- **Respect network policies**: Check with IT before scanning corporate networks
- **Use responsibly**: Network scanning can be detected by network monitoring tools

## Quick Commands Reference

```cmd
# Quick network check (existing tool)
quick-network-check.cmd

# Simple IP scan
scan-network-simple.cmd

# Advanced PowerShell scan
.\scan-network-ips.ps1

# Service detection scan
.\scan-network-advanced.ps1 -DetectServices

# Export results
.\scan-network-advanced.ps1 -ExportResults

# Custom subnet scan
.\scan-network-ips.ps1 -Subnet "192.168.1.1" -Timeout 2000
```

## Support

If you encounter issues:
1. **Check network connectivity**: Can you ping your router?
2. **Verify permissions**: Run as Administrator
3. **Check firewall**: Windows Firewall might block scans
4. **Try different methods**: Use simple batch file if PowerShell fails

