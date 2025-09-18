# ☕ Coffee Machine Quick Start Guide

## 🚨 **Error Fixed!**

The PowerShell script had Unicode/emoji encoding issues on some Windows systems. This has been resolved with a clean version.

## 🚀 **Start Everything (One Command)**

### **Windows (Recommended)**
```cmd
npm run dev:full
```
*Uses clean PowerShell script without emoji characters*

### **Linux/macOS**
```bash
npm run dev:unix
```

### **Windows (Alternative)**
```cmd
npm run dev:windows
```
*Uses CMD batch file*

## 🏥 **Health Check Only**
```cmd
npm run dev:health
```

## 🔧 **Manual Start (If Scripts Fail)**

### **Terminal 1 - Backend**
```cmd
npm start
```

### **Terminal 2 - Frontend**
```cmd
cd frontend
npm start
```

### **Initialize Database (If Needed)**
```cmd
npm run init-db
```

## 📊 **System Health Check**
```cmd
npm run health
```

## 🌐 **Access Points**

Once running:

- **Frontend Management**: http://localhost:3001/
- **Backend API**: http://localhost:3000/api/motong/
- **Health Check**: http://localhost:3000/health

## ⚡ **What Each Script Does**

### **dev:full / dev:unix**
1. Installs dependencies (backend + frontend)
2. Initializes database with mock data
3. Starts backend server (port 3000)
4. Starts frontend app (port 3001)  
5. Runs health checks
6. Shows access URLs
7. Monitors services continuously

### **Health Check**
- Tests backend connection
- Tests frontend availability
- Checks database file
- Tests coffee machine APIs
- Shows overall system health score

## 🚨 **Troubleshooting**

### **Script Won't Run**
```cmd
# Try manual start
npm start
# In another terminal:
cd frontend && npm start
```

### **Port Already in Use**
```cmd
# Kill processes on ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
# Then kill with: taskkill /PID [PID_NUMBER] /F
```

### **Dependencies Missing**
```cmd
npm run reset
```

### **Database Issues**
```cmd
del coffee_machine.db
npm run init-db
```

## 📋 **Available Scripts**

```json
{
  "dev:full": "Start everything (Windows)",
  "dev:unix": "Start everything (Linux/macOS)",
  "dev:windows": "Start everything (Windows CMD)",
  "dev:health": "Health check only",
  "health": "Comprehensive health check",
  "start": "Backend only", 
  "frontend:start": "Frontend only",
  "init-db": "Initialize database",
  "logs:backend": "View backend logs",
  "logs:frontend": "View frontend logs",
  "clean": "Clean all files",
  "reset": "Full reset and reinstall"
}
```

## ✅ **Success Indicators**

You'll know everything is working when you see:

1. **Backend**: "Coffee Machine Backend Server" message
2. **Frontend**: React development server starts
3. **Health Check**: "ALL SYSTEMS OPERATIONAL"
4. **Browser**: Management interface loads at localhost:3001

## 🎯 **Coffee Machine Configuration**

Point your coffee machine to:
```
http://localhost:3000/api/motong/
```

## 📞 **If Nothing Works**

1. Check Node.js is installed: `node --version`
2. Check npm is working: `npm --version`
3. Try manual backend start: `npm start`
4. Check the backend log files
5. Verify ports 3000 and 3001 are available

---

**🎯 Goal**: Get your coffee machine management system running in under 2 minutes! ☕**
