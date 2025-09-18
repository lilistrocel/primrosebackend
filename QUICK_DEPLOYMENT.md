# ⚡ Quick Deployment Guide - Coffee Machine Backend

## 🚀 One-Command Deployment (After Initial Setup)

### For Linux/macOS Servers:
```bash
# Make deployment script executable and run
chmod +x deploy.sh
./deploy.sh
```

### For Windows Servers:
```powershell
# Run deployment script
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

---

## 📋 Step-by-Step Deployment

### 1. Server Preparation

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git build-essential

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version  # Should be v18.x.x+
npm --version   # Should be 9.x.x+
```

#### Windows Server:
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required software
choco install -y nodejs git

# Install PM2 globally
npm install -g pm2

# Verify installations
node --version
npm --version
```

### 2. Clone Your Repository

```bash
# Replace with your repository URL
git clone https://github.com/yourusername/primrosebackend.git
cd primrosebackend
```

### 3. Quick Configuration

```bash
# Copy environment template
cp env.example .env
cp frontend/env.example frontend/.env

# Edit configuration with your server IP
# Replace 192.168.1.100 with your actual server IP
SERVER_IP="192.168.1.100"

# Update .env file (Linux/macOS)
sed -i "s/192.168.1.100/$SERVER_IP/g" .env
sed -i "s/192.168.1.100/$SERVER_IP/g" frontend/.env

# Update .env file (Windows - edit manually)
# Edit .env and frontend/.env files to replace 192.168.1.100 with your server IP
```

### 4. Deploy Application

#### Option A: Automated Deployment (Linux/macOS)
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Option B: Manual Deployment (All Platforms)
```bash
# Install dependencies
npm install --production
cd frontend && npm install --production && cd ..

# Build frontend
npm run frontend:build

# Initialize database
npm run init-db

# Start with PM2
pm2 start ecosystem.config.js
pm2 serve frontend/build 3001 --name "coffee-frontend" --spa
pm2 save

# Set PM2 to start on boot (Linux/macOS)
pm2 startup
# Follow the instructions provided

# Check status
pm2 status
npm run health
```

### 5. Network Configuration

#### Configure Firewall (Linux):
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable

# CentOS/RHEL (Firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

#### Configure Firewall (Windows):
```powershell
New-NetFirewallRule -DisplayName "Coffee Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Coffee Frontend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

## 🌐 Access Points

After deployment, your system will be available at:

- **Backend API**: `http://YOUR_SERVER_IP:3000/api/motong/`
- **Management Interface**: `http://YOUR_SERVER_IP:3001/`
- **Health Check**: `http://YOUR_SERVER_IP:3000/health`

---

## ☕ Coffee Machine Configuration

1. Access your coffee machine's network settings
2. Update the API endpoint to: `http://YOUR_SERVER_IP:3000/api/motong/`
3. Test the connection

---

## 🔧 Quick Commands

```bash
# Check system status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Update to latest version
git pull origin main
./deploy.sh

# Health check
npm run health

# View system metrics
pm2 monit
```

---

## 🚨 Quick Troubleshooting

### Backend not starting:
```bash
pm2 logs coffee-backend
npm install --production
pm2 restart coffee-backend
```

### Frontend not loading:
```bash
npm run frontend:build
pm2 restart coffee-frontend
```

### Coffee machine can't connect:
```bash
# Test API manually
curl -X POST http://YOUR_SERVER_IP:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'

# Check firewall
sudo ufw status  # Linux
netstat -an | findstr :3000  # Windows
```

### Database issues:
```bash
# Recreate database
rm coffee_machine.db  # Linux/macOS
del coffee_machine.db  # Windows
npm run init-db
```

---

## 📊 Monitoring

### Daily Health Check:
```bash
npm run health
```

### Weekly Maintenance:
```bash
# Update system packages
sudo apt update && sudo apt upgrade  # Linux
choco upgrade all  # Windows

# Check logs
pm2 logs --lines 100

# Backup database
cp coffee_machine.db backups/coffee_$(date +%Y%m%d).db
```

---

## 🎯 Success Indicators

You know deployment is successful when:

1. ✅ `pm2 status` shows both services running
2. ✅ `npm run health` passes all checks
3. ✅ `http://YOUR_SERVER_IP:3001` loads the management interface
4. ✅ Coffee machine can successfully connect to `http://YOUR_SERVER_IP:3000/api/motong/`

---

**🎉 Your Coffee Machine Backend is now deployed and ready for production! ☕**

### Next Steps:
1. Configure your coffee machine to use the new API endpoint
2. Test all functionality
3. Set up monitoring and backups
4. Train your team on the management interface
