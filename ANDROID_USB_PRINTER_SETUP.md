# 🔌 Android USB Thermal Printer Setup Guide

## Overview
This guide helps you set up USB thermal receipt printers with your Android tablet kiosk for the K2 Coffee system.

## ⚠️ **IMPORTANT: USB Thermal Printer Requirements**

### **Supported Connection:**
- ✅ **USB thermal receipt printer** connected directly to Android tablet
- ✅ **Android tablet** running the kiosk in Chrome browser
- ✅ **Thermal printer** that supports ESC/POS commands

### **NOT Supported by Web Browser:**
- ❌ Direct USB communication from web browser
- ❌ Native ESC/POS commands via JavaScript
- ❌ Direct hardware access without printer apps

## 🛠️ **Setup Methods (Choose One)**

### **Method 1: Printer Manufacturer App** (RECOMMENDED)

#### **Step 1: Install Official Printer App**
```
Popular USB thermal printer apps:
📱 Epson iPrint & Scan (for Epson printers)
📱 Star Print (for Star Micronics printers)  
📱 Citizen Printer (for Citizen printers)
📱 Bixolon Printer (for Bixolon printers)
📱 Sunmi Printer (for Sunmi built-in printers)
```

#### **Step 2: Connect and Test Printer**
1. **Connect USB printer** to your Android tablet using USB-C/Micro-USB adapter if needed
2. **Open the printer app** and follow setup wizard
3. **Test print** from the app to ensure connection works
4. **Note the printer model** and app package name

#### **Step 3: Configure Kiosk**
1. **Open Chrome browser** on your tablet
2. **Navigate to your kiosk URL**
3. **Place a test order** and click "Print Receipt"
4. **Allow any permissions** requested by browser
5. **Select printer app** when prompted

### **Method 2: Generic ESC/POS Printer App**

#### **Install Universal Printer App:**
```
📱 ESC/POS Printer Driver
📱 Thermal Printer
📱 POS Printer Driver
📱 Bluetooth & USB Printer
```

#### **Setup Process:**
1. **Install** one of the universal printer apps
2. **Connect USB printer** to tablet
3. **Configure** printer in the app (usually auto-detected)
4. **Test print** from the app
5. **Use kiosk** - receipts will attempt to use the configured app

### **Method 3: Android Print Service**

#### **Setup System Printing:**
1. **Go to** Android Settings → Connected devices → Printing
2. **Add print service** if not already enabled
3. **Connect USB printer** - should be auto-detected
4. **Test print** from any app (Photos, Chrome, etc.)
5. **Use kiosk** - will use system print service

### **Method 4: Kiosk App Integration** (ADVANCED)

#### **For Custom Kiosk Apps:**
If you're running the kiosk in a custom Android app (not just Chrome browser):

```javascript
// Add WebView interface in your Android app
public class PrinterInterface {
    @JavascriptInterface
    public boolean printReceipt(String receiptText) {
        // Your native USB printer code here
        return printToUSBPrinter(receiptText);
    }
}

// Register in WebView
webView.addJavascriptInterface(new PrinterInterface(), "Android");
```

## 🔧 **Troubleshooting**

### **❌ Printer Not Detected**
```
Solutions:
✅ Check USB connection and adapter
✅ Restart tablet and reconnect printer
✅ Install official printer manufacturer app
✅ Check if printer requires specific drivers
✅ Try different USB cable/adapter
✅ Enable USB debugging in Developer Options
```

### **❌ Print Button Not Working**
```
Solutions:
✅ Check browser console for error messages
✅ Ensure you're using Chrome browser (not Samsung Internet, etc.)
✅ Allow all permissions when prompted
✅ Test printing from printer app directly first
✅ Clear browser cache and cookies
```

### **❌ Receipt Prints But Format Is Wrong**
```
Solutions:
✅ Check if printer supports ESC/POS commands
✅ Adjust paper width settings in printer app
✅ Use manufacturer's official app instead of generic
✅ Update printer firmware if available
```

### **❌ Browser Shows "Download" Instead of Printing**
```
This is normal behavior when direct printing fails.
Solutions:
✅ Download the HTML receipt file
✅ Open it in the printer app
✅ Print from the printer app
✅ Or forward to email and print later
```

## 📱 **Recommended Printer Apps by Brand**

### **Epson Printers:**
- **App**: Epson iPrint & Scan
- **Models**: TM-m30, TM-T20, TM-T82, TM-P20, TM-P60
- **Setup**: Usually auto-detects USB connection

### **Star Micronics Printers:**
- **App**: Star Print or StarPRNT SDK Sample
- **Models**: TSP143III, TSP654II, TSP700II, SM-L200
- **Setup**: May require manual configuration

### **Citizen Printers:**
- **App**: Citizen Printer or CT-Print
- **Models**: CT-S310II, CT-S651, CT-E351, CT-D150
- **Setup**: Select USB connection in app settings

### **Bixolon Printers:**
- **App**: Bixolon Printer or B-gate Sample
- **Models**: SRP-275III, SRP-350plusIII, SPP-R200III
- **Setup**: Configure USB interface

### **Generic/Other Brands:**
- **App**: ESC/POS Printer Driver or Thermal Printer
- **Setup**: May require manual ESC/POS command configuration

## 🎯 **Testing Your Setup**

### **Step-by-Step Test:**
1. **Connect printer** to tablet via USB
2. **Install printer app** for your brand
3. **Test print** from the app directly
4. **Open Chrome** and go to your kiosk
5. **Place test order** with 1-2 items
6. **Click "Print Receipt"** in success modal
7. **Check browser console** for any error messages
8. **Verify receipt** prints with correct formatting

### **Expected Results:**
```
✅ Receipt should print automatically
✅ Formatting should be clean and readable
✅ All order details should be included
✅ K2 Coffee branding should appear
✅ Total should be correct
```

## 🔍 **Debug Information**

### **Browser Console Logs:**
When you click "Print Receipt", check Chrome's console (F12) for messages like:
```
🖨️ ReceiptPrinter: Starting print process...
🔄 Trying Android USB printer...
✅ Android USB printer successful
```

### **Common Error Messages:**
```
❌ "No suitable printer app found"
   → Install manufacturer's official app

❌ "USB device not accessible"  
   → Check USB connection and permissions

❌ "Print job failed"
   → Test printing from printer app first

❌ "WebView interface not available"
   → Using browser method instead of native app
```

## 📞 **Support**

### **If Nothing Works:**
1. **Test basic printing** from printer app first
2. **Check printer manual** for Android compatibility
3. **Try different printer app** from the brand recommendations
4. **Use download method** as temporary solution
5. **Consider network printer** instead of USB if possible

### **Alternative Solutions:**
- **Bluetooth thermal printer** (if your printer supports it)
- **Network thermal printer** (if you have WiFi)
- **Print server device** (converts USB printer to network)
- **Different tablet** with better USB printer support

---

**🎯 Goal**: Get your USB thermal printer working seamlessly with the Android tablet kiosk! 🖨️**
