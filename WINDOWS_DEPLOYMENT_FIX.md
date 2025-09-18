# 🔧 Windows Deployment Issues - Solutions

## Issue: better-sqlite3 Installation Failure

**Error**: `gyp ERR! find VS - missing any VC++ toolset`

This happens because `better-sqlite3` is a native module that needs to be compiled on Windows, requiring Visual Studio Build Tools with C++ components.

## 🚀 Quick Solutions (Choose One)

### Solution 1: Install Visual Studio Build Tools (Recommended)

```powershell
# Download and install Visual Studio Build Tools
# Go to: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# Or use Chocolatey (if installed)
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"

# Or use winget (Windows 10/11)
winget install Microsoft.VisualStudio.2022.BuildTools
```

**After installation, make sure to:**
1. Include "Desktop development with C++" workload
2. Include "MSVC v143 - VS 2022 C++ x64/x86 build tools"
3. Include "Windows 10/11 SDK"

### Solution 2: Use Pre-built Binaries (Fastest)

```powershell
# Clear npm cache first
npm cache clean --force

# Install with specific flags to force prebuilt binaries
npm install --production --build-from-source=false

# If that fails, try installing better-sqlite3 separately
npm install better-sqlite3@^9.2.2 --build-from-source=false
npm install --production
```

### Solution 3: Alternative SQLite Package

Edit `package.json` to replace `better-sqlite3` with `sqlite3`:

```json
{
  "dependencies": {
    "sqlite3": "^5.1.6"
  }
}
```

Then update the database connection code.

### Solution 4: Use Node.js LTS (Most Compatible)

```powershell
# Uninstall current Node.js version
# Download Node.js 18 LTS from: https://nodejs.org/

# Or use Node Version Manager for Windows
winget install CoreyButler.NVMforWindows
nvm install 18.19.0
nvm use 18.19.0
```

## 🔄 Complete Fix Implementation

### Option A: Quick Database Fix (Recommended)

Let's modify the project to use `sqlite3` instead of `better-sqlite3` for better Windows compatibility:

1. **Update package.json**:
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "joi": "^17.12.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

2. **Update database connection** (see below for code changes)

### Option B: Install Build Tools (Production Ready)

```powershell
# Install Visual Studio Build Tools 2022
# Manual installation:
# 1. Go to https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
# 2. Download "Build Tools for Visual Studio 2022"
# 3. Run installer and select:
#    - "Desktop development with C++" workload
#    - MSVC v143 compiler toolset
#    - Windows 10/11 SDK (latest version)

# After installation, restart PowerShell and try again:
npm install --production
```

## 🔧 Database Code Changes (If Using sqlite3)

If you choose to switch to `sqlite3`, here are the necessary code changes:

### Update `src/database/db.js`:

```javascript
// Replace better-sqlite3 with sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../coffee_machine.db');
    this.db = null;
    this.connect();
  }

  connect() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('✅ Database connected:', this.dbPath);
      }
    });
  }

  // Promisify database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();
```

## 🎯 Immediate Action Steps

1. **Try Solution 2 first** (fastest):
```powershell
npm cache clean --force
npm install --production --build-from-source=false
```

2. **If that fails, use Solution 1** (install Visual Studio Build Tools):
   - Download from Microsoft website
   - Install with C++ workload
   - Restart PowerShell
   - Run `npm install --production` again

3. **If still failing, use Solution 3** (switch to sqlite3):
   - I can help modify the code to use `sqlite3` instead

## ⚠️ Prevention for Future Deployments

Add this to your deployment documentation:

```powershell
# Windows Prerequisites Check
node --version  # Should be LTS version (18.x or 20.x)
npm --version

# Check for Visual Studio Build Tools
where cl  # Should find Microsoft C++ compiler

# If not found, install build tools:
winget install Microsoft.VisualStudio.2022.BuildTools
```

## 🚀 Quick Recovery Commands

```powershell
# Clean everything and start fresh
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

# Try installation with different flags
npm install --production --build-from-source=false --verbose

# If successful, continue with deployment
npm run init-db
npm start
```

Choose the solution that best fits your deployment environment. Solution 2 is usually the fastest for getting up and running quickly!
