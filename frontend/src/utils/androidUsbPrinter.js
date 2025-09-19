/**
 * Android USB Thermal Printer Utility
 * Specialized for USB thermal receipt printers connected to Android tablets
 */

export class AndroidUSBPrinter {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.printerApp = this.detectPrinterApp();
  }

  detectPrinterApp() {
    // Common printer apps that handle USB thermal printers
    const apps = {
      epson: 'com.epson.epos2.sample',
      star: 'com.starmicronics.starprntsdk',
      sunmi: 'woyou.aidlservice.jiuiv5',
      generic: 'com.dantsu.escposprinter'
    };
    return apps;
  }

  /**
   * Main print function for USB thermal printers
   */
  async printReceipt(orderData) {
    console.log('🖨️ AndroidUSBPrinter: Starting print process...', {
      isAndroid: this.isAndroid,
      orderData: orderData
    });

    try {
      // Method 1: Try Android WebView interface (if kiosk app provides it)
      if (window.Android && window.Android.printReceipt) {
        return await this.printViaWebViewInterface(orderData);
      }

      // Method 2: Try printer manufacturer intents
      if (this.isAndroid) {
        return await this.printViaAndroidIntent(orderData);
      }

      // Method 3: Try USB Web API (experimental)
      if ('usb' in navigator) {
        return await this.printViaWebUSB(orderData);
      }

      // Method 4: Try creating a printable format that works with Android print service
      return await this.printViaAndroidPrintService(orderData);

    } catch (error) {
      console.error('❌ AndroidUSBPrinter: All methods failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Method 1: WebView interface (if kiosk app provides native bridge)
   */
  async printViaWebViewInterface(orderData) {
    console.log('🔗 Trying WebView interface...');
    
    try {
      const receiptText = this.generateESCPOSText(orderData);
      const result = window.Android.printReceipt(receiptText);
      
      if (result) {
        console.log('✅ WebView interface print successful');
        return { success: true, method: 'webview' };
      }
    } catch (error) {
      console.log('❌ WebView interface failed:', error);
      throw error;
    }
  }

  /**
   * Method 2: Android Intent for printer apps
   */
  async printViaAndroidIntent(orderData) {
    console.log('📱 Trying Android Intent...');
    
    const receiptText = this.generateESCPOSText(orderData);
    const receiptHTML = this.generateReceiptHTML(orderData);
    
    // Try different intent approaches
    const intents = [
      // Generic print intent
      `intent://print#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(receiptText)};end`,
      
      // ESC/POS printer intent
      `intent://print#Intent;action=com.dantsu.escposprinter.PRINT;type=text/plain;S.text=${encodeURIComponent(receiptText)};end`,
      
      // Star printer intent
      `intent://print#Intent;package=com.starmicronics.starprntsdk;S.text=${encodeURIComponent(receiptText)};end`,
      
      // Epson printer intent
      `intent://print#Intent;package=com.epson.epos2.sample;S.text=${encodeURIComponent(receiptText)};end`
    ];

    for (const intent of intents) {
      try {
        console.log('🔄 Trying intent:', intent.substring(0, 50) + '...');
        window.location.href = intent;
        
        // Give intent time to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { success: true, method: 'android-intent' };
      } catch (error) {
        console.log('❌ Intent failed:', error);
        continue;
      }
    }
    
    throw new Error('All Android intents failed');
  }

  /**
   * Method 3: Web USB API (experimental)
   */
  async printViaWebUSB(orderData) {
    console.log('🔌 Trying Web USB...');
    
    try {
      // Request USB device (thermal printer)
      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
          { vendorId: 0x1659 }, // Citizen
          { vendorId: 0x0fe6 }, // Bixolon
        ]
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      // Generate ESC/POS commands
      const commands = this.generateESCPOSCommands(orderData);
      const data = new TextEncoder().encode(commands);

      // Find the correct endpoint
      const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
        ep => ep.direction === 'out'
      );

      await device.transferOut(endpoint.endpointNumber, data);
      await device.close();

      return { success: true, method: 'web-usb' };
    } catch (error) {
      console.log('❌ Web USB failed:', error);
      throw error;
    }
  }

  /**
   * Method 4: Android Print Service
   */
  async printViaAndroidPrintService(orderData) {
    console.log('🖨️ Trying Android Print Service...');
    
    return new Promise((resolve, reject) => {
      try {
        // Create a special print-optimized HTML
        const receiptHTML = this.generateThermalReceiptHTML(orderData);
        
        // Create iframe for printing
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-10000px';
        printFrame.style.left = '-10000px';
        printFrame.style.width = '80mm';
        printFrame.style.height = 'auto';
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          try {
            // Focus the iframe and trigger print
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            setTimeout(() => {
              document.body.removeChild(printFrame);
              resolve({ success: true, method: 'android-print-service' });
            }, 3000);
          } catch (error) {
            document.body.removeChild(printFrame);
            reject(error);
          }
        };

        printFrame.srcdoc = receiptHTML;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate ESC/POS commands for thermal printers
   */
  generateESCPOSCommands(orderData) {
    const ESC = '\x1B';
    const GS = '\x1D';
    const LF = '\x0A';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@'; // Initialize
    commands += ESC + 'a' + '\x01'; // Center align
    
    // Store header
    commands += ESC + '!' + '\x18'; // Double width and height
    commands += 'K2 COFFEE' + LF;
    commands += ESC + '!' + '\x00'; // Normal size
    commands += 'Premium Coffee Experience' + LF;
    commands += '================================' + LF;
    
    // Order details
    commands += ESC + 'a' + '\x00'; // Left align
    commands += `Order: ${orderData.orderNum || 'N/A'}` + LF;
    commands += `Date: ${new Date().toLocaleString()}` + LF;
    commands += `Items: ${orderData.items?.length || 0}` + LF;
    commands += '--------------------------------' + LF;
    
    // Items
    orderData.items?.forEach(item => {
      commands += `${item.name}` + LF;
      commands += `  Qty: ${item.quantity} x $${item.price?.toFixed(2)}` + LF;
      commands += `  Total: $${(item.quantity * item.price).toFixed(2)}` + LF;
    });
    
    commands += '--------------------------------' + LF;
    commands += ESC + '!' + '\x08'; // Emphasized
    commands += `TOTAL: $${orderData.total?.toFixed(2) || '0.00'}` + LF;
    commands += ESC + '!' + '\x00'; // Normal
    commands += '================================' + LF;
    commands += ESC + 'a' + '\x01'; // Center align
    commands += 'Thank you for your order!' + LF;
    commands += 'Enjoy your coffee!' + LF + LF + LF;
    
    // Cut paper
    commands += GS + 'V' + '\x42' + '\x00';
    
    return commands;
  }

  /**
   * Generate plain text for ESC/POS
   */
  generateESCPOSText(orderData) {
    const currentDate = new Date().toLocaleString();
    let receipt = '';
    
    receipt += '================================\n';
    receipt += '         K2 COFFEE\n';
    receipt += '   Premium Coffee Experience\n';
    receipt += '================================\n';
    receipt += `Order: ${orderData.orderNum || 'N/A'}\n`;
    receipt += `Date: ${currentDate}\n`;
    receipt += `Items: ${orderData.items?.length || 0}\n`;
    receipt += '--------------------------------\n';
    
    orderData.items?.forEach(item => {
      receipt += `${item.name}\n`;
      receipt += `  Qty: ${item.quantity} x $${item.price?.toFixed(2)}\n`;
      receipt += `  Total: $${(item.quantity * item.price).toFixed(2)}\n`;
    });
    
    receipt += '--------------------------------\n';
    receipt += `TOTAL: $${orderData.total?.toFixed(2) || '0.00'}\n`;
    receipt += '================================\n';
    receipt += 'Thank you for your order!\n';
    receipt += 'Enjoy your coffee!\n';
    receipt += '================================\n';
    
    return receipt;
  }

  /**
   * Generate HTML optimized for thermal printing
   */
  generateThermalReceiptHTML(orderData) {
    const currentDate = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt - ${orderData.orderNum}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 0;
                width: 80mm;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.2;
            }
            
            .no-print { display: none !important; }
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 80mm;
            margin: 0;
            padding: 3mm;
            background: white;
            color: black;
        }
        
        .header {
            text-align: center;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .divider {
            border-top: 1px solid #000;
            margin: 5px 0;
        }
        
        .order-info {
            margin: 5px 0;
            font-size: 11px;
        }
        
        .item {
            margin: 3px 0;
            font-size: 11px;
        }
        
        .item-name {
            font-weight: bold;
        }
        
        .item-details {
            margin-left: 5px;
        }
        
        .total {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 10px;
        }
    </style>
</head>
<body onload="window.print();">
    <div class="header">
        <div class="store-name">K2 COFFEE</div>
        <div>Premium Coffee Experience</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="order-info">
        <div><strong>Order:</strong> ${orderData.orderNum || 'N/A'}</div>
        <div><strong>Date:</strong> ${currentDate}</div>
        <div><strong>Items:</strong> ${orderData.items?.length || 0}</div>
    </div>
    
    <div class="divider"></div>
    
    <div class="items">
        ${orderData.items?.map(item => `
            <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    Qty: ${item.quantity} x $${item.price?.toFixed(2)}<br>
                    Total: $${(item.quantity * item.price).toFixed(2)}
                </div>
            </div>
        `).join('') || '<div>No items</div>'}
    </div>
    
    <div class="divider"></div>
    
    <div class="total">
        TOTAL: $${orderData.total?.toFixed(2) || '0.00'}
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
        <div>Thank you for your order!</div>
        <div>Enjoy your coffee!</div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate regular HTML for fallback
   */
  generateReceiptHTML(orderData) {
    return this.generateThermalReceiptHTML(orderData);
  }
}

// Export singleton instance
export const androidUSBPrinter = new AndroidUSBPrinter();
