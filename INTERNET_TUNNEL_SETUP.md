# 🌐 Internet Tunnel Setup Guide

## Overview
Access your K2 Coffee Machine system from anywhere on the internet without a static IP using secure tunneling services.

## 🚀 **Recommended Solutions**

### **Option 1: Ngrok** (RECOMMENDED - Easy Setup)

#### **Install Ngrok:**
1. **Download**: Go to https://ngrok.com/download
2. **Create Account**: Sign up for free at https://ngrok.com/signup
3. **Install**: 
   ```bash
   # Windows (download and extract)
   # Or use chocolatey: choco install ngrok
   
   # Verify installation
   ngrok version
   ```

#### **Setup Authentication:**
```bash
# Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

#### **Start Tunnels:**
```bash
# Terminal 1: Tunnel for Backend (Port 3000)
ngrok http 3000 --subdomain=your-coffee-backend

# Terminal 2: Tunnel for Frontend (Port 3001)  
ngrok http 3001 --subdomain=your-coffee-kiosk
```

#### **Result:**
- **Backend**: `https://your-coffee-backend.ngrok.io`
- **Frontend**: `https://your-coffee-kiosk.ngrok.io`
- **Coffee Machine URL**: Point to `https://your-coffee-backend.ngrok.io/api/motong/`

---

### **Option 2: Cloudflare Tunnel** (FREE - Professional Grade)

#### **Install Cloudflared:**
```bash
# Windows
# Download from: https://github.com/cloudflare/cloudflared/releases
# Or use chocolatey: choco install cloudflared

# Verify installation
cloudflared version
```

#### **Setup:**
```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create k2-coffee

# 3. Create config file (see below)

# 4. Start tunnel
cloudflared tunnel run k2-coffee
```

#### **Config File** (`~/.cloudflared/config.yml`):
```yaml
tunnel: k2-coffee
credentials-file: ~/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: k2-backend.yourdomain.com
    service: http://localhost:3000
  - hostname: k2-kiosk.yourdomain.com  
    service: http://localhost:3001
  - service: http_status:404
```

---

### **Option 3: LocalTunnel** (SIMPLE - No Account Required)

#### **Install:**
```bash
npm install -g localtunnel
```

#### **Start Tunnels:**
```bash
# Terminal 1: Backend tunnel
lt --port 3000 --subdomain k2-coffee-backend

# Terminal 2: Frontend tunnel
lt --port 3001 --subdomain k2-coffee-kiosk
```

#### **Result:**
- **Backend**: `https://k2-coffee-backend.loca.lt`
- **Frontend**: `https://k2-coffee-kiosk.loca.lt`

---

### **Option 4: Bore** (RUST-BASED - Fast & Secure)

#### **Install:**
```bash
# Download from: https://github.com/ekzhang/bore/releases
# Or use cargo: cargo install bore-cli
```

#### **Start Tunnels:**
```bash
# Terminal 1: Backend
bore local 3000 --to bore.pub

# Terminal 2: Frontend  
bore local 3001 --to bore.pub
```

---

## 🛠️ **Complete Setup Script**

### **Automated Tunnel Setup** (`start-with-tunnel.ps1`):

```powershell
# K2 Coffee Machine with Internet Tunnel
param(
    [string]$TunnelService = "ngrok",
    [string]$BackendSubdomain = "k2-coffee-backend",
    [string]$FrontendSubdomain = "k2-coffee-kiosk"
)

Write-Host "🌐 Starting K2 Coffee Machine with Internet Tunnel..." -ForegroundColor Green

# 1. Start Backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized

Start-Sleep 5

# 2. Start Frontend  
Write-Host "🎨 Starting Frontend Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd '$PWD/frontend'; npm start" -WindowStyle Minimized

Start-Sleep 10

# 3. Start Tunnels
Write-Host "🌐 Creating Internet Tunnels..." -ForegroundColor Yellow

switch ($TunnelService) {
    "ngrok" {
        Write-Host "Using Ngrok tunnels..." -ForegroundColor Blue
        Start-Process powershell -ArgumentList "-Command", "ngrok http 3000 --subdomain=$BackendSubdomain" -WindowStyle Normal
        Start-Process powershell -ArgumentList "-Command", "ngrok http 3001 --subdomain=$FrontendSubdomain" -WindowStyle Normal
        
        Write-Host "🎯 Your URLs:" -ForegroundColor Green
        Write-Host "   Backend:  https://$BackendSubdomain.ngrok.io" -ForegroundColor Cyan
        Write-Host "   Frontend: https://$FrontendSubdomain.ngrok.io" -ForegroundColor Cyan
        Write-Host "   Coffee Machine URL: https://$BackendSubdomain.ngrok.io/api/motong/" -ForegroundColor Yellow
    }
    "localtunnel" {
        Write-Host "Using LocalTunnel..." -ForegroundColor Blue
        Start-Process powershell -ArgumentList "-Command", "lt --port 3000 --subdomain $BackendSubdomain" -WindowStyle Normal
        Start-Process powershell -ArgumentList "-Command", "lt --port 3001 --subdomain $FrontendSubdomain" -WindowStyle Normal
        
        Write-Host "🎯 Your URLs:" -ForegroundColor Green
        Write-Host "   Backend:  https://$BackendSubdomain.loca.lt" -ForegroundColor Cyan
        Write-Host "   Frontend: https://$FrontendSubdomain.loca.lt" -ForegroundColor Cyan
    }
    "cloudflare" {
        Write-Host "Using Cloudflare Tunnel..." -ForegroundColor Blue
        Start-Process powershell -ArgumentList "-Command", "cloudflared tunnel run k2-coffee" -WindowStyle Normal
        
        Write-Host "🎯 Check your Cloudflare dashboard for URLs" -ForegroundColor Green
    }
}

Write-Host "✅ K2 Coffee Machine is now accessible from the internet!" -ForegroundColor Green
Write-Host "Press any key to stop all services..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup: Stop all processes
Get-Process | Where-Object {$_.ProcessName -eq "node" -or $_.ProcessName -eq "ngrok" -or $_.ProcessName -eq "cloudflared"} | Stop-Process -Force
```

---

## 🔧 **Configuration for Coffee Machine**

### **Update Coffee Machine Settings:**
Once you have your tunnel URLs, update your coffee machine configuration:

1. **Change the API base URL** from:
   ```
   http://localhost:3000/api/motong/
   ```
   
2. **To your tunnel URL**:
   ```
   https://your-coffee-backend.ngrok.io/api/motong/
   ```

### **Frontend Environment Update:**
Update your frontend environment to use the tunnel URL:

**File: `frontend/.env`**
```env
REACT_APP_API_BASE_URL=https://your-coffee-backend.ngrok.io
```

---

## 🔒 **Security Considerations**

### **Ngrok Security:**
- ✅ **HTTPS by default** - All traffic encrypted
- ✅ **Password protection** available on paid plans
- ✅ **IP whitelisting** available on paid plans
- ⚠️ **Public URL** - Anyone with URL can access

### **Cloudflare Security:**
- ✅ **DDoS protection** included
- ✅ **Access policies** can be configured
- ✅ **Custom domains** supported
- ✅ **WAF (Web Application Firewall)** available

### **Additional Security:**
```javascript
// Add basic auth middleware (optional)
app.use('/api', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer YOUR_SECRET_TOKEN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## 📱 **Mobile Access**

### **QR Code Generation:**
Create QR codes for easy mobile access:

```html
<!-- Add to your kiosk -->
<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://your-coffee-kiosk.ngrok.io" alt="Kiosk QR Code">
```

### **Progressive Web App (PWA):**
Your kiosk can be added to mobile home screens for app-like experience.

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Ngrok "Tunnel not found":**
```bash
# Check if subdomain is available
ngrok http 3000 --subdomain=different-name

# Or use without custom subdomain
ngrok http 3000
```

#### **Coffee Machine Can't Connect:**
```bash
# Check tunnel status
curl https://your-coffee-backend.ngrok.io/health

# Check if backend is running locally first
curl http://localhost:3000/health
```

#### **CORS Issues:**
Add tunnel domain to CORS whitelist in `src/app.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://your-coffee-kiosk.ngrok.io',
    'https://your-coffee-backend.ngrok.io'
  ]
}));
```

### **Performance Tips:**
- **Use paid Ngrok** for better performance and custom domains
- **Cloudflare Tunnel** is fastest for high-traffic scenarios
- **LocalTunnel** is good for testing but may be slower

---

## 🎯 **Recommended Setup for Production**

### **Best Practice:**
1. **Development**: Use LocalTunnel or free Ngrok
2. **Testing**: Use Ngrok with custom subdomain
3. **Production**: Use Cloudflare Tunnel with custom domain

### **Custom Domain Setup:**
With Cloudflare, you can use your own domain:
- `coffee.yourbusiness.com` (Kiosk)
- `api.yourbusiness.com` (Backend)

---

**🎯 Goal**: Access your K2 Coffee Machine from anywhere in the world! 🌍**
