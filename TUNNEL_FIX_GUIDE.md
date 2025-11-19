# 🌐 Tunnel API Connection Fix Guide

## Problem Identified

When accessing the kiosk through the tunnel URL `https://k2.hydromods.org/kiosk`, products were not loading because:

1. **Frontend .env had hardcoded localhost URL** - `REACT_APP_API_BASE_URL=http://localhost:3000`
   - This prevented automatic tunnel detection from working
   - Users accessing through the tunnel were trying to connect to their own local localhost (which doesn't exist)

2. **Backend CORS was blocking tunnel requests** - `ENABLE_TUNNEL=false` in root `.env`
   - The backend was not accepting requests from `*.hydromods.org` domains
   - CORS policy was rejecting all tunnel-originated requests

## Fixes Applied

### 1. Frontend Configuration Fixed ✅
**File:** `frontend/.env`
```env
# Changed from:
REACT_APP_API_BASE_URL=http://localhost:3000

# To:
REACT_APP_API_BASE_URL=auto
```

**Why:** Setting it to `auto` allows the automatic detection logic in `frontend/src/utils/config.js` to work:
- When accessing via `*.hydromods.org` → Uses `https://coffee-api.hydromods.org`
- When accessing via local network → Uses `http://[LOCAL_IP]:3000`
- When accessing via localhost → Uses `http://localhost:3000`

### 2. Backend CORS Configuration Fixed ✅
**File:** `.env` (root)
```env
# Changed from:
ENABLE_TUNNEL=false

# To:
ENABLE_TUNNEL=true
```

**Why:** This enables the backend to accept requests from tunnel domains:
- `https://coffee-api.hydromods.org`
- `https://coffee.hydromods.org`
- `https://k2.hydromods.org`
- `https://api.hydromods.org`
- Any `*.hydromods.org` subdomain

## How to Apply the Fix

### Step 1: Stop Current Services

```powershell
# Stop all PM2 services
pm2 stop all
pm2 delete all

# Or if using PowerShell scripts
.\stop-dev.ps1
```

### Step 2: Rebuild Frontend (Important!)

The frontend needs to be rebuilt because environment variables are baked into the build at compile time:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Build the frontend with new environment variables
npm run build

# Go back to root
cd ..
```

### Step 3: Start Services with New Configuration

```powershell
# Start backend and frontend
.\start-dev.ps1

# Or if using PM2 directly
pm2 start ecosystem.config.js
```

### Step 4: Verify Cloudflare Tunnel is Running

```powershell
# Check if tunnel is running
Get-Process cloudflared

# If not running, start it
.\start-tunnel.bat
```

## Testing the Fix

### Test 1: Local Test File
1. Open `test-tunnel-api.html` in a browser
2. This works both locally and through the tunnel
3. It will auto-detect the correct API URL and test connectivity
4. Check the logs to verify API calls are working

### Test 2: Access Through Tunnel
1. Open browser to: `https://k2.hydromods.org/kiosk`
2. Open browser DevTools (F12)
3. Check Console tab - you should see:
   ```
   🔍 DEBUG: Starting API URL detection...
   🎯 TUNNEL MATCH! currentHost: k2.hydromods.org
   ✅ Final API URL selected: https://coffee-api.hydromods.org
   🍕 KIOSK: Fetching products from: https://coffee-api.hydromods.org/api/motong/products
   🍕 KIOSK: Found [X] products
   ```

### Test 3: Verify CORS Headers
In browser DevTools Network tab:
1. Look for the request to `https://coffee-api.hydromods.org/api/motong/products`
2. Check Response Headers should include:
   ```
   access-control-allow-origin: https://k2.hydromods.org
   access-control-allow-credentials: true
   ```

## Troubleshooting

### Issue: Still seeing localhost errors

**Solution:** Clear browser cache and rebuild frontend
```powershell
# In frontend directory
cd frontend
npm run build
cd ..

# Restart services
pm2 restart all
```

### Issue: CORS errors in browser console

**Solution:** Verify backend is reading the new .env
```powershell
# Check if ENABLE_TUNNEL is actually true
node -e "require('dotenv').config(); console.log('ENABLE_TUNNEL:', process.env.ENABLE_TUNNEL);"

# Should output: ENABLE_TUNNEL: true

# If not, restart backend
pm2 restart backend
```

### Issue: Tunnel not connecting

**Solution:** Check tunnel status and restart if needed
```powershell
# Check tunnel status
cloudflared tunnel info 26b4d1b7-28f0-46f1-894a-8165d521bc7f

# Restart tunnel
pm2 restart cloudflare-tunnel

# Or manually
cloudflared tunnel --config cloudflare-tunnel-config.yml run
```

### Issue: Products still not loading

**Solution:** Check backend is actually running and accessible
```powershell
# Test backend locally first
curl http://localhost:3000/health
curl http://localhost:3000/api/motong/products

# Test backend through tunnel
curl https://coffee-api.hydromods.org/health
curl https://coffee-api.hydromods.org/api/motong/products
```

## How the System Works Now

### Access Method 1: Tunnel (Remote)
```
User Browser
  ↓
https://k2.hydromods.org/kiosk
  ↓
Cloudflare Tunnel → localhost:3001 (Frontend)
  ↓
Frontend detects "hydromods.org" in URL
  ↓
Frontend calls: https://coffee-api.hydromods.org/api/motong/products
  ↓
Cloudflare Tunnel → localhost:3000 (Backend)
  ↓
Backend checks CORS (✅ allowed because ENABLE_TUNNEL=true)
  ↓
Returns products data
```

### Access Method 2: Local Network
```
User Browser
  ↓
http://192.168.10.2:3001/kiosk
  ↓
Frontend detects local network IP
  ↓
Frontend calls: http://192.168.10.2:3000/api/motong/products
  ↓
Backend (local)
  ↓
Returns products data
```

### Access Method 3: Localhost (Development)
```
User Browser
  ↓
http://localhost:3001/kiosk
  ↓
Frontend detects localhost
  ↓
Frontend calls: http://localhost:3000/api/motong/products
  ↓
Backend (local)
  ↓
Returns products data
```

## Summary

✅ **Frontend:** Changed `REACT_APP_API_BASE_URL` from `http://localhost:3000` to `auto`
✅ **Backend:** Changed `ENABLE_TUNNEL` from `false` to `true`
✅ **Result:** Automatic API URL detection now works correctly
✅ **Benefit:** Same codebase works for tunnel, local network, and localhost access

## Next Steps

1. **Rebuild frontend** (critical!)
2. **Restart all services**
3. **Test through tunnel:** https://k2.hydromods.org/kiosk
4. **Test locally:** http://192.168.10.2:3001/kiosk
5. **Monitor logs** for any errors

The kiosk should now load products correctly whether accessed through the tunnel or locally! 🎉

