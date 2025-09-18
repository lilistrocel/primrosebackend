const express = require('express');
const Joi = require('joi');
const db = require('../database/db');
const { getIngredientsWithStatus, getCriticalIngredients, getIngredientName } = require('../config/ingredients');

const router = express.Router();

// Validation schema for saveDeviceMatter request
const saveDeviceMatterSchema = Joi.object({
  matterStatusJson: Joi.string().required(),
  deviceStatusJson: Joi.string().required(), 
  deviceId: Joi.number().integer().required()
});

/**
 * SAVE DEVICE MATTER - Device and ingredient status reporting
 * Called by coffee machine to report current ingredient levels and device health
 * Critical for inventory management and machine maintenance
 */
router.post('/saveDeviceMatter', async (req, res) => {
  try {
    console.log('🔧 saveDeviceMatter called with:', req.body);
    
    // Validate request
    const { error, value } = saveDeviceMatterSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters',
        data: []
      });
    }

    const { matterStatusJson, deviceStatusJson, deviceId } = value;
    
    // Validate JSON strings
    let matterStatus, deviceStatus;
    
    try {
      matterStatus = JSON.parse(matterStatusJson);
      deviceStatus = JSON.parse(deviceStatusJson);
    } catch (parseError) {
      console.log('❌ JSON parsing error:', parseError.message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid JSON format in status data',
        data: []
      });
    }

    // Save device status to database
    const result = db.saveDeviceStatus(deviceId, matterStatusJson, deviceStatusJson);
    
    if (result.lastInsertRowid) {
      console.log(`✅ Device status saved with ID: ${result.lastInsertRowid}`);
      
      // Log ingredient status for monitoring
      logIngredientStatus(matterStatus, deviceId);
      
      // Log device health status
      logDeviceHealth(deviceStatus, deviceId);
      
      // Check for low ingredients or device issues
      checkAlerts(matterStatus, deviceStatus, deviceId);
      
      // Return exact API response format - TESTING DIFFERENT RESPONSES
      const response = {
        code: 0,
        msg: "Request successfully",
        data: []
      };
      
      console.log(`📤 SENDING RESPONSE TO MACHINE:`, JSON.stringify(response));
      console.log(`📤 Response will be sent with status 200`);
      
      res.json(response);
      
    } else {
      console.log('❌ Failed to save device status');
      res.status(500).json({
        code: 500,
        msg: 'Failed to save device status',
        data: []
      });
    }

  } catch (error) {
    console.error('❌ Error in saveDeviceMatter:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error',
      data: []
    });
  }
});

/**
 * Log ingredient status for monitoring and alerts
 */
function logIngredientStatus(matterStatus, deviceId) {
  console.log(`📊 Ingredient Status Report for Device ${deviceId}:`);
  
  const ingredientsWithStatus = getIngredientsWithStatus(matterStatus);
  const criticalIngredients = getCriticalIngredients(matterStatus);
  
  const inStockCount = Object.values(ingredientsWithStatus).filter(ing => ing.status === 'normal').length;
  const outOfStockCount = Object.values(ingredientsWithStatus).filter(ing => ing.status === 'critical').length;
  const totalCount = Object.keys(ingredientsWithStatus).length;
  
  console.log(`   🟢 In Stock: ${inStockCount} | 🔴 Out of Stock: ${outOfStockCount} | Total: ${totalCount}`);
  
  // Show out-of-stock ingredients
  if (criticalIngredients.length > 0) {
    console.log(`   ⚠️ OUT OF STOCK: ${criticalIngredients.map(ing => `${ing.name_en} (${ing.status})`).join(', ')}`);
  }
  
  // Detailed ingredient status with boolean display
  for (const [code, ingredient] of Object.entries(ingredientsWithStatus)) {
    const statusIcon = ingredient.status === 'critical' ? '🔴' : '🟢';
    const statusText = ingredient.currentLevel === 0 || ingredient.currentLevel === '0' ? 'OUT OF STOCK' : 'IN STOCK';
    const abnormalFlag = ingredient.isAbnormal ? ' ⚠️' : '';
    console.log(`   ${statusIcon} ${ingredient.name_en} (${code}): ${statusText}${abnormalFlag}`);
  }
}

/**
 * Log device health status
 */
function logDeviceHealth(deviceStatus, deviceId) {
  console.log(`🔧 Device Health Report for Device ${deviceId}:`);
  
  const devices = Object.entries(deviceStatus);
  const healthyCount = devices.filter(([key, value]) => value === 1).length;
  const totalCount = devices.length;
  
  console.log(`   Healthy: ${healthyCount}/${totalCount} systems`);
  
  // Log system issues
  const issues = devices.filter(([key, value]) => value === 0);
  if (issues.length > 0) {
    console.log(`   🚨 Issues: ${issues.map(([key]) => key).join(', ')}`);
  }
  
  // Detailed device status
  devices.forEach(([system, status]) => {
    const statusText = status === 1 ? '✅ OK' : '❌ Issue';
    console.log(`   ${system}: ${statusText}`);
  });
}

/**
 * Check for alerts and critical issues
 */
function checkAlerts(matterStatus, deviceStatus, deviceId) {
  const alerts = [];
  
  // Check ingredient levels
  const outOfStock = Object.entries(matterStatus)
    .filter(([key, value]) => value === 0)
    .map(([key]) => key);
    
  if (outOfStock.length > 0) {
    alerts.push(`Ingredients out of stock: ${outOfStock.join(', ')}`);
  }
  
  // Check device health
  const deviceIssues = Object.entries(deviceStatus)
    .filter(([key, value]) => value === 0)
    .map(([key]) => key);
    
  if (deviceIssues.length > 0) {
    alerts.push(`Device issues detected: ${deviceIssues.join(', ')}`);
  }
  
  // Critical ingredient check (coffee beans, water, etc.)
  const criticalIngredients = ['CoffeeMatter1', 'CoffeeMatter2', 'CoffeeMatter5'];
  const criticalOutOfStock = criticalIngredients.filter(ingredient => 
    matterStatus[ingredient] === 0
  );
  
  if (criticalOutOfStock.length > 0) {
    alerts.push(`CRITICAL: Essential ingredients out of stock: ${criticalOutOfStock.join(', ')}`);
    console.log('🚨 CRITICAL ALERT: Essential coffee ingredients are out of stock!');
  }
  
  // Printer status check
  if (deviceStatus.lhStatus === 0) {
    alerts.push('Printer system offline');
    console.log('🖨️ WARNING: Printer system is offline - receipts cannot be printed');
  }
  
  // Log all alerts
  if (alerts.length > 0) {
    console.log('⚠️ ALERTS TRIGGERED:');
    alerts.forEach(alert => console.log(`   - ${alert}`));
  } else {
    console.log('✅ All systems operational - no alerts');
  }
  
  return alerts;
}

module.exports = router;
