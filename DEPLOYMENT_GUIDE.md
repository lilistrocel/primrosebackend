# 🚀 Coffee Machine Backend - Complete Deployment Guide

## Overview
This guide covers deploying your Coffee Machine Backend system to a production server using Git. The system includes a Node.js backend, React frontend, and SQLite database.

## 📋 Prerequisites

### Server Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Static IP address, ports 3000-3002 available

### Software Requirements
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Git 2.30.0 or higher
- PM2 (for production process management)

---

## 🔧 Step 1: Server Preparation

### Ubuntu/Debian Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git build-essential

# Install Node.js 18 LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version    # Should be v18.x.x or higher
npm --version     # Should be 9.x.x or higher
git --version     # Should be 2.30+ or higher

# Install PM2 globally for process management
sudo npm install -g pm2

# Create application user (recommended for security)
sudo adduser coffee-admin
sudo usermod -aG sudo coffee-admin
```

### CentOS/RHEL Server Setup

```bash
# Update system packages
sudo yum update -y

# Install EPEL repository
sudo yum install -y epel-release

# Install required packages
sudo yum install -y curl wget git gcc-c++ make

# Install Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installations
node --version
npm --version
git --version

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo adduser coffee-admin
sudo usermod -aG wheel coffee-admin
```

### Windows Server Setup

```powershell
# Install Chocolatey (package manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required software
choco install -y nodejs git

# Verify installations
node --version
npm --version
git --version

# Install PM2 globally
npm install -g pm2
```

---

## 🌐 Step 2: Network Configuration

### Find Your Server's IP Address

```bash
# Linux/macOS
ip addr show | grep "inet " | grep -v 127.0.0.1
# OR
hostname -I

# Windows
ipconfig | findstr "IPv4"
```

### Configure Firewall

#### Ubuntu/Debian (UFW)
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (if using)
sudo ufw allow ssh

# Allow application ports
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 3001/tcp  # Frontend
sudo ufw allow 3002/tcp  # Mock machine dashboard

# Check status
sudo ufw status
```

#### CentOS/RHEL (Firewalld)
```bash
# Enable firewall
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow application ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

#### Windows Server
```powershell
# Allow inbound traffic on required ports
New-NetFirewallRule -DisplayName "Coffee Backend" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Coffee Frontend" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Coffee Mock" -Direction Inbound -Port 3002 -Protocol TCP -Action Allow
```

---

## 📁 Step 3: Repository Setup

### Option A: Clone from Existing Repository

```bash
# Switch to application user (Linux)
sudo su - coffee-admin

# Clone the repository
git clone https://github.com/yourusername/coffee-machine-backend.git
cd coffee-machine-backend

# Set up remote for updates
git remote add origin https://github.com/yourusername/coffee-machine-backend.git
```

### Option B: Initialize New Repository

```bash
# On your development machine, initialize Git repo
cd /path/to/your/project
git init
git add .
git commit -m "Initial coffee machine backend deployment"

# Push to your Git hosting service (GitHub, GitLab, etc.)
git remote add origin https://github.com/yourusername/coffee-machine-backend.git
git push -u origin main

# On server, clone the repository
git clone https://github.com/yourusername/coffee-machine-backend.git
cd coffee-machine-backend
```

---

## ⚙️ Step 4: Environment Configuration

### Create Production Environment Files

```bash
# Create main environment file
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
LOCAL_IP=YOUR_SERVER_IP_HERE
FRONTEND_PORT=3001
BACKEND_PORT=3000
MOCK_PORT=3002
HOST=0.0.0.0

# Database
DB_PATH=./coffee_machine.db

# Logging
LOG_LEVEL=info
LOG_FILE=./coffee_machine.log
EOF

# Create frontend environment file
cat > frontend/.env << EOF
# Frontend Production Configuration
HOST=0.0.0.0
PORT=3001
REACT_APP_API_BASE_URL=http://YOUR_SERVER_IP_HERE:3000
BUILD_PATH=build
GENERATE_SOURCEMAP=false
EOF
```

### Update IP Address in Configuration

```bash
# Replace YOUR_SERVER_IP_HERE with actual server IP
SERVER_IP="192.168.1.100"  # Replace with your actual IP

# Update main .env file
sed -i "s/YOUR_SERVER_IP_HERE/$SERVER_IP/g" .env

# Update frontend .env file
sed -i "s/YOUR_SERVER_IP_HERE/$SERVER_IP/g" frontend/.env

# Verify configuration
cat .env
cat frontend/.env
```

---

## 📦 Step 5: Installation and Setup

### Install Dependencies

```bash
# Install backend dependencies
npm install --production

# Install frontend dependencies
cd frontend
npm install --production
cd ..

# Initialize database with production data
npm run init-db

# Verify installation
npm run health
```

### Build Frontend for Production

```bash
# Build optimized frontend
npm run frontend:build

# Verify build
ls -la frontend/build/
```

---

## 🚀 Step 6: Production Deployment

### Option A: Using PM2 (Recommended)

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'coffee-backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/coffee-backend.log',
      error_file: './logs/coffee-backend-error.log',
      out_file: './logs/coffee-backend-out.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Serve frontend with PM2 (alternative to nginx)
pm2 serve frontend/build 3001 --name "coffee-frontend" --spa

# Check status
pm2 status
pm2 logs
```

### Option B: Using Nginx (Web Server)

```bash
# Install Nginx (Ubuntu/Debian)
sudo apt install -y nginx

# Create Nginx configuration for frontend
sudo tee /etc/nginx/sites-available/coffee-frontend << EOF
server {
    listen 3001;
    server_name YOUR_SERVER_IP_HERE;
    
    root /home/coffee-admin/coffee-machine-backend/frontend/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/coffee-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start only backend with PM2
pm2 start src/app.js --name coffee-backend
```

---

## 🔒 Step 7: Security and SSL Setup

### Basic Security Hardening

```bash
# Update system packages regularly
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates (Ubuntu)
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Set up log rotation
sudo tee /etc/logrotate.d/coffee-machine << EOF
/home/coffee-admin/coffee-machine-backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 coffee-admin coffee-admin
}
EOF
```

### SSL Certificate Setup (Optional but Recommended)

```bash
# Install Certbot for Let's Encrypt (if using domain name)
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Step 8: Monitoring and Maintenance

### Set Up Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
# Coffee Machine Health Check Script

echo "=== Coffee Machine System Health Check ==="
echo "Date: $(date)"
echo

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend: HEALTHY"
else
    echo "❌ Backend: DOWN"
    pm2 restart coffee-backend
fi

# Check if frontend is accessible
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Frontend: HEALTHY"
else
    echo "❌ Frontend: DOWN"
fi

# Check database
if [ -f "./coffee_machine.db" ]; then
    echo "✅ Database: EXISTS"
else
    echo "❌ Database: MISSING"
    npm run init-db
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  Disk usage: ${DISK_USAGE}% (HIGH)"
else
    echo "✅ Disk usage: ${DISK_USAGE}%"
fi

echo "=== End Health Check ==="
EOF

chmod +x health-check.sh

# Set up automated health checks
crontab -e
# Add this line to run health check every 5 minutes:
# */5 * * * * /home/coffee-admin/coffee-machine-backend/health-check.sh >> /home/coffee-admin/coffee-machine-backend/logs/health.log 2>&1
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/coffee-admin/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp ./coffee_machine.db $BACKUP_DIR/coffee_machine_$DATE.db

# Backup configuration
cp .env $BACKUP_DIR/env_$DATE.backup
cp frontend/.env $BACKUP_DIR/frontend_env_$DATE.backup

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Set up daily backups
crontab -e
# Add this line for daily backup at 2 AM:
# 0 2 * * * /home/coffee-admin/coffee-machine-backend/backup.sh >> /home/coffee-admin/coffee-machine-backend/logs/backup.log 2>&1
```

---

## 🔄 Step 9: Deployment and Update Scripts

### Create Deployment Script

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash
# Coffee Machine Deployment Script

echo "🚀 Starting Coffee Machine Deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production
cd frontend && npm install --production && cd ..

# Build frontend
echo "🔨 Building frontend..."
npm run frontend:build

# Backup current database
echo "💾 Backing up database..."
./backup.sh

# Restart services
echo "🔄 Restarting services..."
pm2 restart coffee-backend
pm2 restart coffee-frontend

# Run health check
echo "🏥 Running health check..."
sleep 5
npm run health

echo "✅ Deployment completed!"
EOF

chmod +x deploy.sh
```

### Create Update Script for Configuration

```bash
cat > update-config.sh << 'EOF'
#!/bin/bash
# Configuration Update Script

if [ $# -eq 0 ]; then
    echo "Usage: $0 <new_ip_address>"
    exit 1
fi

NEW_IP=$1

echo "🔧 Updating configuration to IP: $NEW_IP"

# Update main .env file
sed -i "s/LOCAL_IP=.*/LOCAL_IP=$NEW_IP/" .env

# Update frontend .env file
sed -i "s/REACT_APP_API_BASE_URL=.*/REACT_APP_API_BASE_URL=http:\/\/$NEW_IP:3000/" frontend/.env

# Rebuild frontend
npm run frontend:build

# Restart services
pm2 restart all

echo "✅ Configuration updated and services restarted!"
EOF

chmod +x update-config.sh
```

---

## 📱 Step 10: Coffee Machine Integration

### Configure Coffee Machine

1. **Access your coffee machine's network settings**
2. **Update the API endpoint** to point to your server:
   ```
   http://YOUR_SERVER_IP:3000/api/motong/
   ```
3. **Test the connection** using the machine's diagnostic tools

### Test Integration

```bash
# Test from server side
curl -X POST http://localhost:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'

# Test from coffee machine network
curl -X POST http://YOUR_SERVER_IP:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'
```

---

## 🎯 Step 11: Access Points and Usage

### Production URLs

After successful deployment, your system will be available at:

- **Backend API**: `http://YOUR_SERVER_IP:3000/api/motong/`
- **Management Interface**: `http://YOUR_SERVER_IP:3001/`
- **Health Check**: `http://YOUR_SERVER_IP:3000/health`
- **Mock Machine Dashboard**: `http://YOUR_SERVER_IP:3002/` (if enabled)

### Common Operations

```bash
# Check system status
pm2 status

# View logs
pm2 logs coffee-backend
pm2 logs coffee-frontend

# Restart services
pm2 restart coffee-backend
pm2 restart coffee-frontend

# Update to latest version
./deploy.sh

# Change IP configuration
./update-config.sh 192.168.1.200

# Run health check
npm run health

# View system metrics
pm2 monit
```

---

## 🚨 Step 12: Troubleshooting Guide

### Common Issues and Solutions

#### Backend Not Starting
```bash
# Check logs
pm2 logs coffee-backend

# Common fixes
npm install --production  # Reinstall dependencies
npm run init-db          # Recreate database
pm2 restart coffee-backend
```

#### Frontend Not Loading
```bash
# Rebuild frontend
npm run frontend:build

# Check Nginx logs (if using)
sudo tail -f /var/log/nginx/error.log

# Restart frontend
pm2 restart coffee-frontend
```

#### Coffee Machine Can't Connect
```bash
# Check firewall
sudo ufw status
telnet YOUR_SERVER_IP 3000

# Check network configuration
cat .env
npm run network:config

# Test API manually
curl -X POST http://YOUR_SERVER_IP:3000/api/motong/deviceOrderQueueList \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"1"}'
```

#### Database Issues
```bash
# Check database file
ls -la coffee_machine.db

# Recreate database
rm coffee_machine.db
npm run init-db

# Restore from backup
cp /home/coffee-admin/backups/coffee_machine_YYYYMMDD_HHMMSS.db ./coffee_machine.db
```

---

## 📋 Step 13: Maintenance Checklist

### Daily Tasks
- [ ] Check system health: `npm run health`
- [ ] Review logs: `pm2 logs`
- [ ] Monitor disk space: `df -h`

### Weekly Tasks
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Review backup files: `ls -la /home/coffee-admin/backups/`
- [ ] Check PM2 status: `pm2 status`

### Monthly Tasks
- [ ] Update Node.js and npm if needed
- [ ] Review and rotate logs
- [ ] Test backup restoration procedure
- [ ] Update SSL certificates (if using)

---

## 🎉 Deployment Complete!

Your Coffee Machine Backend is now fully deployed and ready for production use!

### Next Steps
1. **Test all functionality** with your coffee machine
2. **Configure monitoring alerts** for your team
3. **Document any custom configurations** for your environment
4. **Train your team** on system maintenance and monitoring

### Support
For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `pm2 logs`
3. Run health check: `npm run health`
4. Consult the project documentation

**🎯 Your coffee machine management system is now running professionally! ☕**
