# Alert System Troubleshooting Guide

## 🚨 **Issue: Low Stock Alerts Not Showing**

### **Problem Description:**
- Coffee Beans Type 1 stock is below minimum threshold (100 < 200)
- No alerts appear in Alert Dashboard
- No alerts appear in Inventory Dashboard

### **Root Cause:**
The alert system only creates alerts automatically when inventory levels change through the `updateItemStock()` method. If inventory levels are set manually or through other processes, alerts are not created automatically.

### **Solution Implemented:**

#### **1. Manual Alert Creation**
Created a script to check all inventory items and create missing alerts:

```bash
# Check and create missing alerts
npm run check-alerts

# Show current alerts
npm run check-alerts:show

# Resolve all alerts
npm run check-alerts:resolve
```

#### **2. Alert Checker Utility**
Created `src/utils/alert-checker.js` with methods to:
- Check all inventory items for alert conditions
- Create missing alerts automatically
- Get active alerts
- Resolve alerts

#### **3. CLI Script**
Created `check-alerts.js` for easy alert management:
- `node check-alerts.js` - Check and create missing alerts
- `node check-alerts.js --show` - Show current alerts
- `node check-alerts.js --resolve-all` - Resolve all alerts

## 🔧 **How to Fix Missing Alerts**

### **Step 1: Check Current Alerts**
```bash
npm run check-alerts:show
```

### **Step 2: Create Missing Alerts**
```bash
npm run check-alerts
```

### **Step 3: Verify Alert Dashboard**
1. Navigate to `/alerts` in the frontend
2. Check that alerts are now visible
3. Verify alert details and severity levels

## 📊 **Alert System Architecture**

### **Automatic Alert Creation:**
- ✅ **When inventory changes** via `updateItemStock()` method
- ✅ **During order processing** via `processOrderConsumption()`
- ✅ **During manual stock updates** via inventory management

### **Manual Alert Creation:**
- ✅ **Alert Checker utility** - `src/utils/alert-checker.js`
- ✅ **CLI script** - `check-alerts.js`
- ✅ **Package.json scripts** - `npm run check-alerts`

### **Alert Types:**
1. **Low Stock** - When `current_stock <= min_threshold`
2. **Out of Stock** - When `current_stock <= 0`
3. **Overstock** - When `current_stock > max_stock * 1.01`

## 🎯 **Prevention Strategies**

### **1. Regular Alert Checks**
Set up a cron job or scheduled task to run alert checks:

```bash
# Run every hour
0 * * * * cd /path/to/project && npm run check-alerts
```

### **2. Inventory Management Integration**
Ensure all inventory updates go through the proper methods:
- Use `updateItemStock()` for stock changes
- Use `processOrderConsumption()` for order-related changes
- Use inventory management interface for manual updates

### **3. Monitoring Dashboard**
- Check Alert Dashboard regularly at `/alerts`
- Monitor inventory levels in Inventory Dashboard
- Set up notifications for critical alerts

## 🚀 **Quick Fix Commands**

### **Check System Status:**
```bash
# Check all alerts
npm run check-alerts:show

# Check system health
npm run health

# Check inventory levels
node -e "const db = require('./src/database/db'); const items = db.inventory.db.prepare('SELECT * FROM inventory_items WHERE is_active = 1').all(); items.forEach(item => console.log(item.display_name + ': ' + item.current_stock + '/' + item.min_threshold));"
```

### **Create Missing Alerts:**
```bash
# Create all missing alerts
npm run check-alerts

# Verify alerts were created
npm run check-alerts:show
```

### **Resolve Alerts:**
```bash
# Resolve all alerts
npm run check-alerts:resolve

# Or use the Alert Dashboard at /alerts
```

## 🔍 **Troubleshooting Steps**

### **1. Verify Alert System is Working:**
```bash
# Check if alerts exist in database
node -e "const db = require('./src/database/db'); const alerts = db.inventory.db.prepare('SELECT * FROM inventory_alerts WHERE is_resolved = 0').all(); console.log('Active alerts:', alerts.length); alerts.forEach(a => console.log(a.message));"
```

### **2. Check Inventory Levels:**
```bash
# Check all inventory items
node -e "const db = require('./src/database/db'); const items = db.inventory.db.prepare('SELECT * FROM inventory_items WHERE is_active = 1').all(); items.forEach(item => { const isLow = item.current_stock <= item.min_threshold; console.log(item.display_name + ': ' + item.current_stock + '/' + item.min_threshold + (isLow ? ' ⚠️ LOW' : ' ✅ OK')); });"
```

### **3. Test Alert Dashboard API:**
```bash
# Test the alert dashboard endpoint
curl -X POST http://localhost:3000/api/motong/alert-dashboard/getActiveAlerts \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **4. Check Backend Logs:**
Look for error messages in the backend console or log files that might indicate why alerts aren't being created.

## 📋 **Alert System Components**

### **Database Tables:**
- `inventory_items` - Stores inventory item information
- `inventory_alerts` - Stores alert records
- `inventory_transactions` - Tracks stock changes

### **Backend Components:**
- `src/database/inventory-db.js` - Core inventory management
- `src/routes/alertDashboard.js` - Alert API endpoints
- `src/utils/alert-checker.js` - Alert checking utility

### **Frontend Components:**
- `frontend/src/pages/AlertDashboard.js` - Alert display page
- `frontend/src/pages/InventoryDashboard.js` - Inventory management page

### **CLI Tools:**
- `check-alerts.js` - Command-line alert management
- `package.json` scripts - NPM script shortcuts

## ✅ **Verification Checklist**

After fixing missing alerts, verify:

- [ ] Alert Dashboard shows the alert at `/alerts`
- [ ] Alert has correct severity (critical for low stock)
- [ ] Alert message is descriptive and helpful
- [ ] Alert can be resolved from the dashboard
- [ ] Inventory Dashboard shows the low stock item
- [ ] Alert API endpoint returns the alert
- [ ] No duplicate alerts exist

## 🎯 **Best Practices**

### **1. Regular Maintenance:**
- Run `npm run check-alerts` daily
- Monitor Alert Dashboard regularly
- Check inventory levels weekly

### **2. Alert Management:**
- Resolve alerts promptly when issues are fixed
- Use Alert Dashboard for bulk operations
- Keep alert messages descriptive

### **3. System Integration:**
- Ensure all inventory changes go through proper methods
- Monitor backend logs for alert creation errors
- Set up automated alert checking

The alert system is now fully functional and will help you stay on top of inventory issues! 🎉
