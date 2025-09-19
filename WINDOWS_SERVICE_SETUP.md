# ☕ Windows Service Setup Guide
**Auto-start Coffee Machine Backend & Cloudflare Tunnel on Windows Boot**

## 🎯 Overview

This guide will help you set up your Coffee Machine system to automatically start when your Windows PC boots up. Both the **Cloudflare tunnel** and **Coffee backend** will run as Windows services.

## 📋 Prerequisites

- ✅ Windows 10/11 or Windows Server
- ✅ Administrator access
- ✅ Node.js installed
- ✅ Cloudflare Tunnel (`cloudflared`) installed
- ✅ Your Coffee Machine project in a fixed directory

## 🚀 Quick Installation

### **Method 1: One-Click Install (Recommended)**

1. **Right-click** on `install-services.bat`
2. Select **"Run as administrator"**
3. Follow the prompts
4. ✅ Done! Services are installed and running

### **Method 2: PowerShell Install**

```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd "C:\Path\To\Your\Coffee\Project"
.\install-windows-services.ps1
```

## 📊 Service Management

### **GUI Manager**
```powershell
# Launch the visual service manager
.\service-manager.ps1
```

### **Command Line Manager**
```powershell
# Check service status
.\control-services.ps1 status

# Start services
.\control-services.ps1 start

# Stop services
.\control-services.ps1 stop

# Restart services
.\control-services.ps1 restart

# View logs
.\control-services.ps1 logs
```

### **Windows Services Manager**
- Press `Win + R`, type `services.msc`
- Look for:
  - **K2 Coffee Cloudflare Tunnel** (`CoffeeTunnel`)
  - **K2 Coffee Machine Backend** (`CoffeeBackend`)

## 🔧 What Gets Installed

### **Service 1: CoffeeTunnel**
- **Command**: `cloudflared tunnel run k2-coffee`
- **Description**: Cloudflare tunnel for external access
- **Startup**: Automatic
- **Logs**: `logs\tunnel.log`

### **Service 2: CoffeeBackend**
- **Command**: `npm run dev:debug`
- **Description**: Node.js Coffee Machine Backend
- **Startup**: Automatic (starts after tunnel)
- **Logs**: `logs\backend.log`

## 📁 File Structure After Installation

```
your-project/
├── install-services.bat           # One-click installer
├── install-windows-services.ps1   # Main installation script
├── control-services.ps1           # Service management script
├── service-manager.ps1            # GUI service manager
├── uninstall-services.ps1         # Service removal script
├── nssm.exe                       # Service management tool
└── logs/
    ├── tunnel.log                 # Cloudflare tunnel logs
    ├── tunnel-error.log           # Tunnel error logs
    ├── backend.log                # Backend service logs
    └── backend-error.log          # Backend error logs
```

## 🛠️ Advanced Configuration

### **Modify Service Settings**

```powershell
# Change service startup type
nssm.exe set CoffeeTunnel Start SERVICE_DEMAND_START  # Manual start
nssm.exe set CoffeeTunnel Start SERVICE_AUTO_START    # Auto start

# Change working directory
nssm.exe set CoffeeBackend AppDirectory "C:\New\Path"

# Change service account (if needed)
nssm.exe set CoffeeBackend ObjectName ".\ServiceAccount" "password"
```

### **Environment Variables**

```powershell
# Add environment variables to services
nssm.exe set CoffeeBackend AppEnvironmentExtra NODE_ENV=production
```

## 🔍 Troubleshooting

### **Service Won't Start**

1. **Check logs**:
   ```powershell
   .\control-services.ps1 logs
   ```

2. **Verify paths**:
   - Ensure `cloudflared.exe` is in PATH
   - Ensure `npm` is in PATH
   - Check project directory exists

3. **Test manually**:
   ```powershell
   # Test tunnel
   cloudflared tunnel run k2-coffee
   
   # Test backend
   npm run dev:debug
   ```

### **Permission Issues**

```powershell
# Run as different user
nssm.exe set CoffeeTunnel ObjectName ".\Administrator" "password"
```

### **Port Conflicts**

```powershell
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### **Firewall Issues**

```powershell
# Add firewall rules
New-NetFirewallRule -DisplayName "Coffee Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Coffee Frontend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## 🗑️ Uninstalling Services

### **Method 1: Uninstall Script**
```powershell
.\uninstall-services.ps1
```

### **Method 2: Manual Removal**
```powershell
nssm.exe stop CoffeeBackend
nssm.exe stop CoffeeTunnel
nssm.exe remove CoffeeBackend confirm
nssm.exe remove CoffeeTunnel confirm
```

## 🌐 Access URLs After Setup

Once services are running, access your Coffee Machine at:

- **Kiosk Interface**: https://k2.hydromods.org/kiosk
- **Management Interface**: https://k2.hydromods.org/items
- **Order Monitor**: https://k2.hydromods.org/orders
- **Device Status**: https://k2.hydromods.org/device
- **Local Access**: http://192.168.10.6:3001/ (your local IP)

## ✅ Verification Checklist

After installation, verify:

- [ ] Services show as "Running" in `services.msc`
- [ ] Tunnel URL responds: https://k2.hydromods.org/kiosk
- [ ] Local URL responds: http://192.168.10.6:3001/
- [ ] Services survive reboot test
- [ ] Logs are being generated in `logs/` folder
- [ ] Coffee machine can connect and receive orders

## 🆘 Support

If you encounter issues:

1. **Check the logs**: `.\control-services.ps1 logs`
2. **Verify service status**: `.\control-services.ps1 status`
3. **Test manual startup**: Run commands manually first
4. **Check Windows Event Viewer**: Look for service-related errors

## 🎉 Success!

Your Coffee Machine system will now:
- ✅ Start automatically when Windows boots
- ✅ Run reliably as Windows services
- ✅ Generate logs for troubleshooting
- ✅ Be accessible both locally and via tunnel
- ✅ Survive system restarts and crashes

**Your coffee business is now running 24/7!** ☕🚀
