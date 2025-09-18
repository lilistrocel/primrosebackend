# 🚀 Coffee Machine Development Guide

## Quick Start Commands

### 🎯 **One-Command Development Start**

#### **Windows (PowerShell)**
```powershell
# Full development environment (recommended - uses clean script)
npm run dev:full

# Health check only
npm run dev:health

# Alternative batch file
npm run dev:windows

# Direct script execution (if needed)
.\start-dev-clean.ps1
```

#### **Linux/macOS (Bash)**
```bash
# Full development environment  
npm run dev:unix

# Or directly
./start-dev.sh
```

#### **Manual Start (Any Platform)**
```bash
# Backend only
npm start

# Frontend only (in new terminal)
npm run frontend:start

# Health check
npm run health
```

## 📋 Available Scripts

### 🏗️ **Development Scripts**
```bash
npm run dev:full        # Start both backend + frontend (Windows)
npm run dev:unix        # Start both backend + frontend (Linux/macOS)  
npm run dev:windows     # Start both backend + frontend (Windows CMD)
npm run dev:health      # Health check only
```

### 🔧 **Service Scripts**
```bash
npm start               # Start backend server
npm run backend:start   # Start backend server
npm run frontend:start  # Start frontend application
npm run frontend:build  # Build frontend for production
npm run frontend:install # Install frontend dependencies
```

### 🗄️ **Database Scripts**
```bash
npm run init-db         # Initialize database with mock data
npm run health          # Comprehensive health check
```

### 📊 **Monitoring Scripts**
```bash
npm run logs:backend    # View backend logs
npm run logs:frontend   # View frontend logs
npm run health          # System health check
```

### 🧹 **Maintenance Scripts**
```bash
npm run clean           # Remove logs, database, node_modules
npm run reset           # Full reset + reinstall + reinitialize
```

## 🎛️ **Script Options**

### **PowerShell Script (start-dev.ps1)**
```powershell
# Basic usage
.\start-dev.ps1

# Skip dependency installation
.\start-dev.ps1 -SkipInstall

# Health check only
.\start-dev.ps1 -HealthOnly

# Custom ports
.\start-dev.ps1 -BackendPort 8000 -FrontendPort 8001

# Quiet mode (less output)
.\start-dev.ps1 -Quiet
```

### **Bash Script (start-dev.sh)**
```bash
# Basic usage
./start-dev.sh

# Skip dependency installation
./start-dev.sh --skip-install

# Health check only  
./start-dev.sh --health-only

# Custom ports
./start-dev.sh --backend-port 8000 --frontend-port 8001

# Quiet mode
./start-dev.sh --quiet
```

## 🏥 **Health Monitoring**

### **Comprehensive Health Check**
```bash
# Run detailed health check
npm run health

# Or directly
node health-check.js
```

**Health Check Features:**
- ✅ Backend service availability
- ✅ Frontend application status  
- ✅ Database file existence and access
- ✅ Coffee machine API endpoints
- ✅ Response time monitoring
- ✅ Overall system health score

### **Quick Status Check**
```bash
# Windows
npm run dev:health

# Linux/macOS  
./start-dev.sh --health-only
```

## 🌐 **Access Points**

Once everything is running, you can access:

### **Backend Services**
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api/motong/
- **Server Info**: http://localhost:3000/

### **Frontend Application**
- **Management UI**: http://localhost:3001/
- **Item Manager**: http://localhost:3001/items  
- **Order Monitor**: http://localhost:3001/orders
- **Device Status**: http://localhost:3001/device
- **Settings**: http://localhost:3001/settings

### **Coffee Machine Configuration**
Point your coffee machine to: `http://localhost:3000/api/motong/`

## 🔧 **Development Workflow**

### **1. Initial Setup**
```bash
# Clone/download project
git clone <repository> # or download zip

# Run full setup
npm run reset
```

### **2. Daily Development**
```bash
# Start everything
npm run dev:full        # Windows
# or
npm run dev:unix        # Linux/macOS

# Check health
npm run health
```

### **3. Testing Changes**
```bash
# Backend changes
npm start

# Frontend changes  
npm run frontend:start

# Database changes
npm run init-db
```

### **4. Troubleshooting**
```bash
# View logs
npm run logs:backend
npm run logs:frontend

# Reset everything
npm run reset

# Health diagnosis
npm run health
```

## 🚨 **Troubleshooting Guide**

### **Backend Won't Start**
```bash
# Check if port is in use
netstat -an | findstr :3000

# Check logs
npm run logs:backend

# Reset and try again
npm run reset
```

### **Frontend Won't Start**
```bash
# Install dependencies
npm run frontend:install

# Check logs
npm run logs:frontend

# Try different port
cd frontend && PORT=3002 npm start
```

### **Database Issues**
```bash
# Recreate database
rm coffee_machine.db
npm run init-db

# Check database file
ls -la coffee_machine.db
```

### **Port Conflicts**
```bash
# Use different ports
.\start-dev.ps1 -BackendPort 8000 -FrontendPort 8001

# Or set environment variables
set PORT=8000
npm start
```

## 📱 **Mobile Development**

### **Access from Mobile Device**
1. Find your computer's IP address
2. Replace `localhost` with your IP
3. Ensure firewall allows connections

```bash
# Example with IP 192.168.1.100
# Backend: http://192.168.1.100:3000
# Frontend: http://192.168.1.100:3001
```

## 🔒 **Security Notes**

### **Development Mode**
- CORS is enabled for localhost
- No authentication required
- Debug logging enabled
- Hot reload active

### **Production Deployment**
- Change CORS settings
- Add authentication
- Disable debug logs
- Build optimized frontend

## 📊 **Performance Monitoring**

### **Response Times**
- Backend health check shows response times
- Frontend uses React DevTools
- Database queries logged in backend

### **Resource Usage**
```bash
# Monitor Node.js processes
ps aux | grep node

# Check memory usage
top -p $(pgrep node)
```

## 🔄 **Update Workflow**

### **Update Dependencies**
```bash
# Update backend
npm update

# Update frontend
cd frontend && npm update
```

### **Update Database Schema**
```bash
# Backup current data
cp coffee_machine.db coffee_machine.db.backup

# Update schema (manual process)
# Then reinitialize
npm run init-db
```

## 🎯 **Production Deployment**

### **Backend Production**
```bash
# Build optimized
NODE_ENV=production npm start

# Or use PM2
npm install -g pm2
pm2 start src/app.js --name coffee-backend
```

### **Frontend Production**
```bash
# Build for production
npm run frontend:build

# Serve with nginx/apache or static server
cd frontend/build && npx serve -s .
```

## 📞 **Support**

### **Common Issues**
1. **Port already in use**: Change ports or kill existing processes
2. **Dependencies missing**: Run `npm run reset`
3. **Database corruption**: Delete and recreate with `npm run init-db`
4. **Network issues**: Check firewall and CORS settings

### **Debug Information**
When reporting issues, include:
- Output of `npm run health`
- Contents of `backend.log` and `frontend.log`
- Operating system and Node.js version
- Steps to reproduce the issue

---

**🎯 Goal**: Make development as smooth as coffee! ☕**
