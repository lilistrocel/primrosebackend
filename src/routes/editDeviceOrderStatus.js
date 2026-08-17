const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

// Validation schema for editDeviceOrderStatus request.
// The egg machine (AbuEgg, deviceId=3) sends orderId + orderGoodsId as JSON strings
// via .ToString(); the coffee/fried machines send them as numbers. Accept both and
// coerce — Joi's default convert:true already handles the string→number case, but
// the explicit alternatives keep the intent obvious.
const editOrderStatusSchema = Joi.object({
  orderId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  orderGoodsId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  status: Joi.number().integer().valid(-1, 1, 2, 3, 4, 5).required()
});

/**
 * EDIT DEVICE ORDER STATUS - CRITICAL ENDPOINT
 * Called by coffee machine to update order status during production
 * Machine calls this when: starting production (status 4) or completing (status 5)
 */
router.post('/editDeviceOrderStatus', async (req, res) => {
  try {
    console.log('🔄 editDeviceOrderStatus called with:', req.body);
    console.log('📡 Request Headers:', req.headers);
    console.log('🌐 Request URL:', req.url);
    console.log('🔍 Request Method:', req.method);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Validate request
    const { error, value } = editOrderStatusSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters',
        data: []
      });
    }

    const { orderId, orderGoodsId, status } = value;
    
    console.log(`🔄 editDeviceOrderStatus: orderId=${orderId}, orderGoodsId=${orderGoodsId}, status=${status} (${getStatusName(status)})`);
    
    // Debug: Show all available orders and goods for troubleshooting
    console.log('🔍 DEBUG: Looking for orderId:', orderId, 'orderGoodsId:', orderGoodsId);
    const allOrders = db.db.prepare('SELECT id, order_num, status FROM orders').all();
    const allGoods = db.db.prepare('SELECT id, order_id, goods_name, status FROM order_goods').all();
    console.log('📊 All orders in DB:', allOrders);
    console.log('📦 All goods in DB:', allGoods);
    
    // Validate that the order goods exists
    const existingGoods = db.db.prepare('SELECT * FROM order_goods WHERE id = ? AND order_id = ?').get(orderGoodsId, orderId);
    
    if (!existingGoods) {
      console.log(`❌ Order goods not found: orderGoodsId=${orderGoodsId}, orderId=${orderId}`);
      return res.status(404).json({
        code: 404,
        msg: 'Order or goods not found',
        data: []
      });
    }

    // Update the order goods status
    const updateResult = db.updateOrderGoodsStatus(orderGoodsId, status);
    
    if (updateResult.changes > 0) {
      console.log(`✅ Updated order goods ${orderGoodsId} to status ${status} (${getStatusName(status)})`);
      
      // Also update the main order status if needed
      updateMainOrderStatus(orderId, status);
      
      // Process inventory consumption when order is completed
      if (status === 5) { // Order completed
        processInventoryConsumption(orderId);
      }
      
      // Log the status change for machine tracking
      logStatusChange(orderId, orderGoodsId, existingGoods.status, status);
      
      // Return exact API response format
      res.json({
        code: 0,
        msg: "Operation successfully",
        data: []
      });
      
    } else {
      console.log(`❌ Failed to update order goods ${orderGoodsId}`);
      res.status(500).json({
        code: 500,
        msg: 'Failed to update order status',
        data: []
      });
    }

  } catch (error) {
    console.error('❌ Error in editDeviceOrderStatus:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error',
      data: []
    });
  }
});

/**
 * Update main order status based on all goods status
 * If all goods are completed (5), mark order as completed
 * If any goods are processing (4), mark order as processing
 */
function updateMainOrderStatus(orderId, newGoodsStatus) {
  try {
    // Get all goods for this order
    const allGoods = db.getOrderGoodsForOrder(orderId);
    
    if (allGoods.length === 0) return;
    
    // Determine overall order status
    let orderStatus;
    
    if (allGoods.every(goods => goods.status === -1 || goods.status === 0)) {
      // All goods cancelled - according to API doc, no explicit cancelled status for orders
      // Keep as completed (5) since the order processing is "finished"
      orderStatus = 5;
    } else if (allGoods.every(goods => goods.status === 5)) {
      // All goods completed
      orderStatus = 5;
    } else if (allGoods.some(goods => goods.status === 4)) {
      // Some goods processing
      orderStatus = 4;
    } else if (allGoods.every(goods => goods.status === 3)) {
      // All goods queuing
      orderStatus = 3;
    } else {
      // Mixed status, keep current or set to processing
      orderStatus = 4;
    }
    
    // Update main order status
    const updateResult = db.updateOrderStatus(orderId, orderStatus);
    
    if (updateResult.changes > 0) {
      console.log(`🔄 Updated main order ${orderId} to status ${orderStatus} (${getStatusName(orderStatus)})`);
    }
    
  } catch (error) {
    console.error('❌ Error updating main order status:', error);
  }
}

/**
 * Log status changes for debugging and machine behavior tracking
 */
function logStatusChange(orderId, orderGoodsId, oldStatus, newStatus) {
  const oldStatusName = getStatusName(oldStatus);
  const newStatusName = getStatusName(newStatus);
  
  console.log(`📝 Status Change Log:`);
  console.log(`   Order ID: ${orderId}`);
  console.log(`   Goods ID: ${orderGoodsId}`);
  console.log(`   Status: ${oldStatus} (${oldStatusName}) → ${newStatus} (${newStatusName})`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  
  // Critical status changes that affect machine operation
  if (newStatus === 4) {
    console.log(`🟡 MACHINE STARTED PRODUCTION for goods ${orderGoodsId}`);
  } else if (newStatus === 5) {
    console.log(`🟢 MACHINE COMPLETED PRODUCTION for goods ${orderGoodsId}`);
  } else if (newStatus === -1) {
    console.log(`🔴 ORDER CANCELLED for goods ${orderGoodsId}`);
  }
}

/**
 * Get status name based on status code
 */
function getStatusName(status) {
  const statusNames = {
    0: "Cancelled", // Adding status 0 as cancelled too
    1: "Unpaid",
    2: "Paid", 
    3: "Queuing",
    4: "Processing",
    5: "Completed",
    '-1': "Cancelled",
    '-3': "Refunded"
  };
  
  return statusNames[status] || "Unknown";
}

/**
 * Process inventory consumption when an order is completed
 */
function processInventoryConsumption(orderId) {
  try {
    console.log(`🔄 Processing inventory consumption for order ${orderId}`);
    
    // Check if inventory system is available
    if (!db.inventory) {
      console.log('⚠️ Inventory system not available, skipping consumption tracking');
      return;
    }
    
    // Process the order consumption
    const transactions = db.inventory.processOrderConsumption(orderId);
    
    if (transactions && transactions.length > 0) {
      console.log(`✅ Processed ${transactions.length} inventory transactions for order ${orderId}`);
    } else {
      console.log(`ℹ️ No inventory consumption recorded for order ${orderId} (no product ingredients configured)`);
    }
    
  } catch (error) {
    console.error('❌ Error processing inventory consumption:', error);
    // Don't throw error - inventory consumption failure shouldn't break order processing
  }
}

module.exports = router;
