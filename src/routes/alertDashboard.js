const express = require('express');
const db = require('../database/db');

const router = express.Router();

/**
 * GET ACTIVE ALERTS - Dashboard endpoint for critical alerts only
 * Excludes CoffeeMatter 6,7,8 as requested
 */
router.post('/getActiveAlerts', async (req, res) => {
  try {
    console.log('🚨 AlertDashboard: Fetching active alerts...');
    
    // Get all active alerts (not resolved)
    const alerts = db.inventory.db.prepare(`
      SELECT 
        ia.*,
        ii.display_name,
        ii.name,
        ii.category,
        ii.unit,
        ii.current_stock,
        ii.min_threshold,
        ii.max_stock
      FROM inventory_alerts ia
      JOIN inventory_items ii ON ia.item_id = ii.id
      WHERE ia.is_resolved = 0
      ORDER BY ia.created_at DESC
    `).all();
    
    console.log(`📊 Found ${alerts.length} total active alerts`);
    
    // Filter out CoffeeMatter 6,7,8 as requested
    const filteredAlerts = alerts.filter(alert => {
      const itemName = alert.name.toLowerCase();
      return !itemName.includes('coffeematter6') && 
             !itemName.includes('coffeematter7') && 
             !itemName.includes('coffeematter8');
    });
    
    console.log(`✅ Returning ${filteredAlerts.length} filtered alerts (excluded CoffeeMatter 6,7,8)`);
    
    // Transform alerts for frontend
    const responseData = filteredAlerts.map(alert => ({
      id: alert.id,
      itemId: alert.item_id,
      alertType: alert.alert_type,
      thresholdValue: alert.threshold_value,
      currentValue: alert.current_value,
      message: alert.message,
      createdAt: alert.created_at,
      itemName: alert.display_name,
      category: alert.category,
      unit: alert.unit,
      currentStock: alert.current_stock,
      minThreshold: alert.min_threshold,
      maxStock: alert.max_stock,
      severity: getAlertSeverity(alert.alert_type, alert.current_stock, alert.min_threshold),
      priority: getAlertPriority(alert.alert_type, alert.current_stock, alert.min_threshold)
    }));
    
    // Sort by priority (high priority first)
    responseData.sort((a, b) => b.priority - a.priority);
    
    res.json({
      code: 0,
      msg: "Active alerts fetched successfully",
      data: responseData,
      summary: {
        total: responseData.length,
        critical: responseData.filter(a => a.severity === 'critical').length,
        warning: responseData.filter(a => a.severity === 'warning').length,
        info: responseData.filter(a => a.severity === 'info').length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching active alerts:', error);
    res.status(500).json({
      code: 500,
      msg: "Failed to fetch active alerts",
      data: []
    });
  }
});

/**
 * RESOLVE ALERT - Mark alert as resolved
 */
router.post('/resolveAlert', async (req, res) => {
  try {
    const { alertId } = req.body;
    
    if (!alertId) {
      return res.status(400).json({
        code: 400,
        msg: "Alert ID is required",
        data: []
      });
    }
    
    console.log(`🔧 Resolving alert ${alertId}...`);
    
    const result = db.inventory.db.prepare(`
      UPDATE inventory_alerts 
      SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND is_resolved = 0
    `).run(alertId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        msg: "Alert not found or already resolved",
        data: []
      });
    }
    
    console.log(`✅ Alert ${alertId} resolved successfully`);
    
    res.json({
      code: 0,
      msg: "Alert resolved successfully",
      data: { alertId, resolvedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('❌ Error resolving alert:', error);
    res.status(500).json({
      code: 500,
      msg: "Failed to resolve alert",
      data: []
    });
  }
});

/**
 * RESOLVE ALL ALERTS - Mark all alerts as resolved
 */
router.post('/resolveAllAlerts', async (req, res) => {
  try {
    console.log('🔧 Resolving all active alerts...');
    
    const result = db.inventory.db.prepare(`
      UPDATE inventory_alerts 
      SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP 
      WHERE is_resolved = 0
    `).run();
    
    console.log(`✅ Resolved ${result.changes} alerts`);
    
    res.json({
      code: 0,
      msg: `Resolved ${result.changes} alerts successfully`,
      data: { resolvedCount: result.changes }
    });

  } catch (error) {
    console.error('❌ Error resolving all alerts:', error);
    res.status(500).json({
      code: 500,
      msg: "Failed to resolve all alerts",
      data: []
    });
  }
});

/**
 * Get alert severity based on type and stock levels
 */
function getAlertSeverity(alertType, currentStock, minThreshold) {
  if (alertType === 'out_of_stock' || currentStock <= 0) {
    return 'critical';
  }
  if (alertType === 'low_stock' && currentStock <= minThreshold * 0.5) {
    return 'critical';
  }
  if (alertType === 'low_stock') {
    return 'warning';
  }
  if (alertType === 'overstock') {
    return 'info';
  }
  return 'warning';
}

/**
 * Get alert priority for sorting (higher number = higher priority)
 */
function getAlertPriority(alertType, currentStock, minThreshold) {
  if (alertType === 'out_of_stock' || currentStock <= 0) {
    return 100; // Highest priority
  }
  if (alertType === 'low_stock' && currentStock <= minThreshold * 0.5) {
    return 90; // Very high priority
  }
  if (alertType === 'low_stock') {
    return 70; // High priority
  }
  if (alertType === 'overstock') {
    return 10; // Low priority
  }
  return 50; // Medium priority
}

module.exports = router;
