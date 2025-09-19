# 🖨️ Receipt Printing Guide

## Overview

The K2 Coffee Kiosk now includes comprehensive receipt printing functionality that works with various printer types connected to tablets and other devices.

## Printing Methods Supported

### 🔷 **Method 1: Bluetooth ESC/POS Printers** (Recommended)
- **Best for**: Thermal receipt printers (Star TSP143, Epson TM-m30, etc.)
- **Requirements**: 
  - Printer with Bluetooth support
  - ESC/POS command compatibility
  - Web Bluetooth API support (Chrome, Edge)
- **Features**:
  - Direct thermal printing
  - Professional receipt formatting
  - Automatic paper cutting
  - Fast printing speed

### 🔷 **Method 2: Browser Printing**
- **Best for**: USB printers, network printers, tablet-connected printers
- **Requirements**: Any printer recognized by the operating system
- **Features**:
  - Uses standard browser print dialog
  - Works with most printer types
  - Customizable receipt layout
  - Print preview available

### 🔷 **Method 3: Android Intent**
- **Best for**: Android tablets with printer apps
- **Requirements**: 
  - Android device
  - Printer manufacturer app installed (Epson iPrint, Star Print, etc.)
- **Features**:
  - Deep integration with printer apps
  - Native printing quality
  - Manufacturer-specific features

### 🔷 **Method 4: Download Fallback**
- **Best for**: When other methods fail
- **Features**:
  - Downloads receipt as HTML file
  - Can be printed later
  - Saves order record

## How to Use

### 1. **After Placing an Order**
1. Complete your order on the kiosk
2. In the success modal, click **"Print Receipt"**
3. The system will automatically try different printing methods
4. Receipt will print using the best available method

### 2. **Receipt Content**
The receipt includes:
- **K2 Coffee branding and logo**
- **Order number and timestamp**
- **Itemized list** with quantities and prices
- **Total amount**
- **Thank you message**

## Setup Instructions

### For Bluetooth Thermal Printers:

#### **1. Pair Your Printer**
```
1. Turn on your thermal printer
2. Enable Bluetooth pairing mode (check printer manual)
3. On your tablet: Settings > Bluetooth > Pair new device
4. Select your printer from the list
5. Complete pairing process
```

#### **2. Enable Web Bluetooth** (Chrome/Edge)
```
1. Open Chrome or Edge browser
2. Go to: chrome://flags/#enable-experimental-web-platform-features
3. Enable "Experimental Web Platform features"
4. Restart browser
```

#### **3. Test Printing**
```
1. Place a test order on the kiosk
2. Click "Print Receipt" in success modal
3. When prompted, select your Bluetooth printer
4. Allow connection permissions
```

### For USB/Network Printers:

#### **1. Install Printer Drivers**
```
1. Connect printer via USB or network
2. Install manufacturer drivers on your tablet
3. Test printing from any app to verify setup
```

#### **2. Browser Permissions**
```
1. When printing, allow popup permissions
2. Select your printer in the print dialog
3. Adjust settings if needed (paper size, orientation)
```

### For Android Tablets:

#### **1. Install Printer App**
```
Popular printer apps:
- Epson iPrint & Scan
- Star Print
- Brother iPrint&Scan
- Canon PRINT
```

#### **2. Connect Printer to App**
```
1. Open the printer app
2. Follow setup wizard to connect printer
3. Test printing from the app
```

## Troubleshooting

### **❌ Bluetooth Printing Not Working**
```
Solutions:
✅ Check if printer is in pairing mode
✅ Verify Web Bluetooth is enabled in browser
✅ Try Chrome or Edge browser (Safari not supported)
✅ Restart browser and retry
✅ Check printer compatibility (ESC/POS support required)
```

### **❌ Browser Printing Issues**
```
Solutions:
✅ Allow popup permissions for kiosk website
✅ Check if printer drivers are installed
✅ Test printing from another app first
✅ Try different paper size settings
✅ Clear browser cache and cookies
```

### **❌ Android Intent Not Working**
```
Solutions:
✅ Install official printer manufacturer app
✅ Complete printer setup in the app first
✅ Grant necessary permissions to browser
✅ Try opening kiosk in Chrome browser
```

### **❌ No Printing Methods Work**
```
Fallback:
✅ Use "Print Receipt" button
✅ Download the HTML receipt file
✅ Open and print from any device later
✅ Forward receipt via email if needed
```

## Technical Details

### Supported Printer Commands (ESC/POS):
```
- ESC @ (Initialize printer)
- ESC a (Text alignment)
- ESC ! (Text size and emphasis)
- GS V (Paper cutting)
- Character encoding support
```

### Receipt Dimensions:
```
- Width: 72mm (thermal paper standard)
- Font: Courier New (monospace)
- Line spacing: Optimized for readability
- Paper cutting: Automatic after printing
```

### Browser Compatibility:
```
✅ Chrome 56+ (Full support)
✅ Edge 79+ (Full support)
✅ Firefox 55+ (Limited Bluetooth support)
❌ Safari (No Web Bluetooth support)
```

## Security & Privacy

- **No data stored**: Receipts are generated and printed locally
- **Bluetooth security**: Uses standard Bluetooth encryption
- **No cloud printing**: All printing happens on local device
- **Permission-based**: User must grant printing permissions

## Advanced Configuration

### Custom Receipt Template:
You can modify the receipt layout by editing:
```
frontend/src/utils/receiptPrinter.js
```

### Printer-Specific Settings:
For specific printer models, you can customize:
- ESC/POS command sequences
- Character encoding
- Paper width settings
- Cutting behavior

### Integration with Other Systems:
The receipt printer can be extended to:
- Send receipts via email
- Save to cloud storage
- Integrate with POS systems
- Print kitchen tickets

## Support

### **Common Printer Brands Tested:**
- ✅ **Epson**: TM-m30, TM-T20, TM-T82
- ✅ **Star Micronics**: TSP143III, TSP654II
- ✅ **Citizen**: CT-S310II, CT-S651
- ✅ **Bixolon**: SRP-275III, SRP-350plusIII

### **Need Help?**
1. Check printer manual for Bluetooth/ESC-POS support
2. Test with manufacturer's official app first
3. Verify tablet Bluetooth/USB connectivity
4. Try different browsers (Chrome recommended)

---

**🎯 Goal**: Seamless receipt printing experience for every customer! 🖨️**
