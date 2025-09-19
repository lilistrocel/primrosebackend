import { androidUSBPrinter } from './androidUsbPrinter';

/**
 * Receipt Printer Utility
 * Supports multiple printing methods for tablet-connected receipt printers
 */

export class ReceiptPrinter {
  constructor() {
    this.printerType = this.detectPrinterType();
  }

  detectPrinterType() {
    // Detect if we're on a tablet/mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    
    if (isMobile || isTablet) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Main print function - tries multiple methods
   */
  async printReceipt(orderData) {
    try {
      console.log('🖨️ ReceiptPrinter: Starting print process...', {
        printerType: this.printerType,
        isAndroid: /Android/i.test(navigator.userAgent),
        orderData: orderData
      });

      // Method 1: Try Android USB Printer (PRIMARY for USB thermal printers on Android)
      if (/Android/i.test(navigator.userAgent)) {
        try {
          console.log('🔄 Trying Android USB printer...');
          const result = await androidUSBPrinter.printReceipt(orderData);
          if (result.success) {
            console.log('✅ Android USB printer successful');
            return result;
          }
        } catch (error) {
          console.log('❌ Android USB printer failed, trying next method...', error);
        }
      }

      // Method 2: Try Web Bluetooth for ESC/POS thermal printers
      if ('bluetooth' in navigator) {
        try {
          console.log('🔄 Trying Bluetooth printing...');
          await this.printViaBluetooth(orderData);
          return { success: true, method: 'bluetooth' };
        } catch (error) {
          console.log('❌ Bluetooth printing failed, trying next method...', error);
        }
      }

      // Method 3: Try browser printing (works for many tablet printers)
      try {
        console.log('🔄 Trying browser printing...');
        await this.printViaBrowser(orderData);
        return { success: true, method: 'browser' };
      } catch (error) {
        console.log('❌ Browser printing failed, trying next method...', error);
      }

      // Method 4: Try legacy Android Intent
      if (this.printerType === 'mobile' && window.Android) {
        try {
          console.log('🔄 Trying legacy Android intent...');
          await this.printViaAndroidIntent(orderData);
          return { success: true, method: 'android-legacy' };
        } catch (error) {
          console.log('❌ Android intent printing failed...', error);
        }
      }

      // Method 5: Download receipt as fallback
      console.log('🔄 Using download fallback...');
      this.downloadReceipt(orderData);
      return { success: true, method: 'download' };

    } catch (error) {
      console.error('❌ All printing methods failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Method 1: Bluetooth ESC/POS printing (for thermal receipt printers)
   */
  async printViaBluetooth(orderData) {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [0x18F0] }, // ESC/POS service
        { namePrefix: 'POS' },
        { namePrefix: 'Printer' },
        { namePrefix: 'Receipt' }
      ],
      optionalServices: [0x18F0, '000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(0x18F0);
    const characteristic = await service.getCharacteristic(0x2AF1);

    // Generate ESC/POS commands
    const escPos = this.generateESCPOSCommands(orderData);
    const encoder = new TextEncoder();
    const data = encoder.encode(escPos);

    await characteristic.writeValue(data);
    console.log('Receipt sent to Bluetooth printer');
  }

  /**
   * Method 2: Browser printing (works with many USB/network printers)
   */
  async printViaBrowser(orderData) {
    return new Promise((resolve, reject) => {
      // Create a hidden iframe for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-1000px';
      printFrame.style.left = '-1000px';
      document.body.appendChild(printFrame);

      const receiptHTML = this.generateReceiptHTML(orderData);
      
      printFrame.onload = () => {
        try {
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
            resolve();
          }, 1000);
        } catch (error) {
          document.body.removeChild(printFrame);
          reject(error);
        }
      };

      printFrame.srcdoc = receiptHTML;
    });
  }

  /**
   * Method 3: Android Intent (for Android tablets with printer apps)
   */
  async printViaAndroidIntent(orderData) {
    const receiptText = this.generateReceiptText(orderData);
    
    // Call Android native function if available
    if (window.Android && window.Android.printReceipt) {
      window.Android.printReceipt(receiptText);
    } else {
      // Try generic Android intent
      const intent = `intent://print#Intent;scheme=print;package=com.epson.epos2.sample;S.text=${encodeURIComponent(receiptText)};end`;
      window.location.href = intent;
    }
  }

  /**
   * Method 4: Download receipt (fallback)
   */
  downloadReceipt(orderData) {
    const receiptHTML = this.generateReceiptHTML(orderData);
    
    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderData.orderNum || Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate ESC/POS commands for thermal printers
   */
  generateESCPOSCommands(orderData) {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@'; // Initialize
    commands += ESC + 'a' + '\x01'; // Center align
    
    // Store header
    commands += ESC + '!' + '\x18'; // Double height and width
    commands += 'K2 COFFEE\n';
    commands += ESC + '!' + '\x00'; // Normal size
    commands += '================================\n';
    
    // Order details
    commands += ESC + 'a' + '\x00'; // Left align
    commands += `Order: ${orderData.orderNum}\n`;
    commands += `Date: ${new Date().toLocaleString()}\n`;
    commands += '--------------------------------\n';
    
    // Items
    orderData.items?.forEach(item => {
      commands += `${item.name}\n`;
      commands += `  Qty: ${item.quantity} x $${item.price}\n`;
      commands += `  Total: $${(item.quantity * item.price).toFixed(2)}\n`;
    });
    
    commands += '--------------------------------\n';
    commands += ESC + '!' + '\x08'; // Emphasized
    commands += `TOTAL: $${orderData.total}\n`;
    commands += ESC + '!' + '\x00'; // Normal
    commands += '================================\n';
    commands += ESC + 'a' + '\x01'; // Center align
    commands += 'Thank you for your order!\n';
    commands += 'Enjoy your coffee!\n\n\n';
    
    // Cut paper
    commands += GS + 'V' + '\x42' + '\x00';
    
    return commands;
  }

  /**
   * Generate HTML receipt for browser printing
   */
  generateReceiptHTML(orderData) {
    const currentDate = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - ${orderData.orderNum}</title>
    <style>
        @media print {
            @page {
                size: 80mm 200mm;
                margin: 0;
            }
            body { margin: 0; }
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 72mm;
            margin: 0 auto;
            padding: 5mm;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        
        .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }
        
        .order-info {
            margin: 10px 0;
        }
        
        .item {
            margin: 5px 0;
        }
        
        .item-name {
            font-weight: bold;
        }
        
        .item-details {
            margin-left: 10px;
            font-size: 11px;
        }
        
        .total {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="store-name">K2 COFFEE</div>
        <div>☕ Premium Coffee Experience ☕</div>
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
                    Qty: ${item.quantity} x $${item.price?.toFixed(2)}
                    <br>Total: $${(item.quantity * item.price).toFixed(2)}
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
        <div>Enjoy your coffee! ☕</div>
        <br>
        <div>Visit us again soon!</div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text receipt
   */
  generateReceiptText(orderData) {
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
}

// Export singleton instance
export const receiptPrinter = new ReceiptPrinter();
