/**
 * Alert Checker Utility
 * Checks all inventory items and creates missing alerts
 * This should be run periodically to ensure no alerts are missed
 */

const db = require('../database/db');

class AlertChecker {
  constructor() {
    this.inventory = db.inventory;
  }

  /**
   * Check all inventory items and create missing alerts
   */
  async checkAllAlerts() {
    try {
      console.log('🔍 Checking all inventory items for alert conditions...');
      
      // Get all active inventory items
      const items = this.inventory.db.prepare(`
        SELECT * FROM inventory_items 
        WHERE is_active = 1 
        ORDER BY display_name
      `).all();
      
      console.log(`📋 Found ${items.length} active inventory items`);
      
      let alertsCreated = 0;
      let alertsChecked = 0;
      
      for (const item of items) {
        console.log(`\n🔍 Checking ${item.display_name}:`);
        console.log(`   Current Stock: ${item.current_stock} ${item.unit}`);
        console.log(`   Min Threshold: ${item.min_threshold} ${item.unit}`);
        console.log(`   Max Stock: ${item.max_stock} ${item.unit}`);
        
        alertsChecked++;
        
        // Check for low stock alert
        if (item.current_stock <= item.min_threshold) {
          console.log(`   ⚠️  LOW STOCK DETECTED!`);
          
          // Check if alert already exists
          const existingAlert = this.inventory.db.prepare(`
            SELECT * FROM inventory_alerts 
            WHERE item_id = ? AND alert_type = ? AND is_resolved = 0
          `).get(item.id, item.current_stock <= 0 ? 'out_of_stock' : 'low_stock');
          
          if (existingAlert) {
            console.log(`   ℹ️  Alert already exists (ID: ${existingAlert.id})`);
          } else {
            // Create new alert
            const alertType = item.current_stock <= 0 ? 'out_of_stock' : 'low_stock';
            const message = item.current_stock <= 0 
              ? `${item.display_name} is out of stock!`
              : `${item.display_name} is running low (${item.current_stock} ${item.unit} remaining)`;
            
            const result = this.inventory.db.prepare(`
              INSERT INTO inventory_alerts (item_id, alert_type, threshold_value, current_value, message, created_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(item.id, alertType, item.min_threshold, item.current_stock, message);
            
            console.log(`   ✅ Created ${alertType} alert (ID: ${result.lastInsertRowid})`);
            alertsCreated++;
          }
        }
        
        // Check for overstock alert (if current stock > 101% of max stock)
        if (item.max_stock > 0 && item.current_stock > (item.max_stock * 1.01)) {
          console.log(`   📈 OVERSTOCK DETECTED!`);
          
          // Check if alert already exists
          const existingAlert = this.inventory.db.prepare(`
            SELECT * FROM inventory_alerts 
            WHERE item_id = ? AND alert_type = 'overstock' AND is_resolved = 0
          `).get(item.id);
          
          if (existingAlert) {
            console.log(`   ℹ️  Overstock alert already exists (ID: ${existingAlert.id})`);
          } else {
            // Create new alert
            const message = `${item.display_name} is overstocked (${item.current_stock} ${item.unit} in stock)`;
            
            const result = this.inventory.db.prepare(`
              INSERT INTO inventory_alerts (item_id, alert_type, threshold_value, current_value, message, created_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(item.id, 'overstock', item.max_stock * 1.01, item.current_stock, message);
            
            console.log(`   ✅ Created overstock alert (ID: ${result.lastInsertRowid})`);
            alertsCreated++;
          }
        }
        
        if (item.current_stock > item.min_threshold && (item.max_stock <= 0 || item.current_stock <= (item.max_stock * 1.01))) {
          console.log(`   ✅ Stock levels are normal`);
        }
      }
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`   Items checked: ${alertsChecked}`);
      console.log(`   Alerts created: ${alertsCreated}`);
      
      return {
        itemsChecked: alertsChecked,
        alertsCreated: alertsCreated
      };
      
    } catch (error) {
      console.error('❌ Error checking alerts:', error);
      throw error;
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts() {
    try {
      const alerts = this.inventory.db.prepare(`
        SELECT ia.*, ii.display_name, ii.unit
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.item_id = ii.id
        WHERE ia.is_resolved = 0
        ORDER BY ia.created_at DESC
      `).all();
      
      return alerts;
    } catch (error) {
      console.error('❌ Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    try {
      const result = this.inventory.db.prepare(`
        UPDATE inventory_alerts 
        SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND is_resolved = 0
      `).run(alertId);
      
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Resolve all alerts
   */
  resolveAllAlerts() {
    try {
      const result = this.inventory.db.prepare(`
        UPDATE inventory_alerts 
        SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP 
        WHERE is_resolved = 0
      `).run();
      
      return result.changes;
    } catch (error) {
      console.error('❌ Error resolving all alerts:', error);
      throw error;
    }
  }
}

module.exports = AlertChecker;
