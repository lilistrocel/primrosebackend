# 🚀 Quick Internet Tunnel Setup

## **Instant Setup (3 Steps)**

### **Step 1: Choose Your Method**

#### **🟢 Option A: LocalTunnel (Easiest - No Account Needed)**
```bash
npm run tunnel:localtunnel
```
**Result**: Gets you `https://k2-coffee-backend.loca.lt` and `https://k2-coffee-kiosk.loca.lt`

#### **🔵 Option B: Ngrok (Best - Requires Free Account)**
1. **Sign up**: https://ngrok.com/signup
2. **Get auth token**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Setup**: `ngrok config add-authtoken YOUR_TOKEN_HERE`
4. **Run**: `npm run tunnel:ngrok`

**Result**: Gets you `https://k2-coffee-backend.ngrok.io` and `https://k2-coffee-kiosk.ngrok.io`

#### **⚪ Option C: Interactive Choice**
```bash
npm run tunnel
```
**Result**: Shows menu to pick tunnel service

---

### **Step 2: Configure Your Coffee Machine**

Once tunnels are running, update your coffee machine's API URL from:
```
http://localhost:3000/api/motong/
```

To your new tunnel URL:
```
https://k2-coffee-backend.ngrok.io/api/motong/
```
*OR*
```
https://k2-coffee-backend.loca.lt/api/motong/
```

---

### **Step 3: Access From Anywhere**

#### **📱 Kiosk (for customers)**:
- **Ngrok**: `https://k2-coffee-kiosk.ngrok.io/kiosk`
- **LocalTunnel**: `https://k2-coffee-kiosk.loca.lt/kiosk`

#### **⚙️ Management (for you)**:
- **Ngrok**: `https://k2-coffee-kiosk.ngrok.io`
- **LocalTunnel**: `https://k2-coffee-kiosk.loca.lt`

---

## **What Each Service Does**

### **LocalTunnel** 🟢
- ✅ **Free forever**
- ✅ **No account needed**
- ✅ **Instant setup**
- ⚠️ **May be slower**
- ⚠️ **URL changes on restart**

### **Ngrok** 🔵
- ✅ **Very fast and reliable**
- ✅ **Professional features**
- ✅ **Custom subdomains**
- ⚠️ **Requires free account**
- ⚠️ **Free plan has limits**

---

## **Mobile QR Codes**

When tunnels are running, the script will show QR code links like:
```
🎯 Kiosk QR Code:
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://your-url.ngrok.io/kiosk
```

Open that link to get a QR code you can scan with phones/tablets!

---

## **Common Issues & Solutions**

### **❌ "Subdomain already taken"**
```bash
# Use different subdomain
npm run tunnel:ngrok -- -BackendSubdomain "my-coffee-api" -FrontendSubdomain "my-coffee-ui"
```

### **❌ "Ngrok not found"**
1. Download from: https://ngrok.com/download
2. Extract to a folder in your PATH
3. Try again

### **❌ "LocalTunnel not found"**
```bash
npm install -g localtunnel
npm run tunnel:localtunnel
```

### **❌ Coffee machine can't connect**
1. **Check if tunnel is running**: Open the backend URL in browser
2. **Verify API path**: Should end with `/api/motong/`
3. **Check coffee machine settings**: Make sure it points to the HTTPS tunnel URL

---

## **Security Notes**

⚠️ **Your coffee machine will be accessible from the internet**
- URLs are public (anyone with URL can access)
- Use Ngrok paid plan for password protection
- Consider IP restrictions for production use

✅ **All traffic is encrypted (HTTPS)**
✅ **No permanent changes to your system**
✅ **Stop anytime by closing the script**

---

**🎯 Goal**: Get your coffee machine online in under 5 minutes! 🌐**
