const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

// Validation schema for deviceOrderQueueList request
const deviceOrderQueueListSchema = Joi.object({
  deviceId: Joi.string().required()
});

/**
 * GET DEVICE ORDER QUEUE LIST - MOST CRITICAL ENDPOINT
 * This endpoint is continuously polled by the coffee machine
 * to check for active orders and get production instructions
 */
router.post('/deviceOrderQueueList', async (req, res) => {
  try {
    console.log('☕ deviceOrderQueueList called with:', req.body);
    
    // Validate request
    const { error, value } = deviceOrderQueueListSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters',
        data: []
      });
    }

    const { deviceId } = value;
    
    // Get active orders for device (status 3=Queuing, 4=Processing)
    const orders = db.getAllOrdersForDevice(parseInt(deviceId));
    console.log(`📋 Found ${orders.length} active orders for device ${deviceId}`);

    // Check if test mode is enabled
    const isTestMode = db.isTestMode();
    console.log(`🧪 Test Mode: ${isTestMode ? 'ENABLED' : 'DISABLED'}`);

    // Transform orders to exact API response format
    const responseData = orders.map(order => {
      // Get all goods for this order
      const allGoods = db.getOrderGoodsForOrder(order.id);
      
      // Group goods by type (1=奶茶, 2=咖啡, 3=冰淇淋, 4=其他)
      const typeList1 = allGoods.filter(goods => goods.type === 1).map(goods => transformGoods(goods));
      const typeList2 = allGoods.filter(goods => goods.type === 2).map(goods => transformGoods(goods));
      const typeList3 = allGoods.filter(goods => goods.type === 3).map(goods => transformGoods(goods));
      const typeList4 = allGoods.filter(goods => goods.type === 4).map(goods => transformGoods(goods));

      // In test mode, move coffee orders (type 2) to typeList100 for debugging
      let typeList100 = [];
      if (isTestMode) {
        typeList100 = typeList2; // Move all coffee orders to typeList100
        console.log(`🧪 TEST MODE: Moving ${typeList2.length} coffee orders to typeList100`);
      }

      // Transform order to exact response format
      const orderResponse = {
        id: order.id,
        num: order.num,
        realPrice: order.real_price.toString(),
        status: order.status,
        orderNum: order.order_num,
        created_at: order.created_at,
        language: order.language || "en",
        createdAt: order.created_time,
        statusName: getStatusName(order.status),
        typeList4: typeList4,
        typeList3: typeList3,
        typeList2: isTestMode ? [] : typeList2, // Empty in test mode
        typeList1: typeList1
      };

      // Add typeList100 if in test mode
      if (isTestMode) {
        orderResponse.typeList100 = typeList100;
      }

      return orderResponse;
    });

    // Return exact API response format
    const response = {
      code: 0,
      msg: "Request successfully",
      data: responseData
    };

    console.log('✅ Returning order queue response with', responseData.length, 'orders');
    res.json(response);

  } catch (error) {
    console.error('❌ Error in deviceOrderQueueList:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error',
      data: []
    });
  }
});

/**
 * Transform order goods to exact API response format
 * This is critical - the machine depends on this exact structure
 */
function transformGoods(goods) {
  return {
    id: goods.id,
    deviceGoodsId: goods.device_goods_id,
    type: goods.type,
    orderId: goods.order_id,
    goodsId: goods.goods_id,
    goodsName: goods.goods_name,
    goodsNameEn: goods.goods_name_en || goods.goods_name,
    goodsNameOt: goods.goods_name_ot || goods.goods_name,
    goodsImg: goods.goods_img,
    goodsOptionName: goods.goods_option_name || "",
    goodsOptionNameEn: goods.goods_option_name_en || goods.goods_option_name || "",
    goodsOptionNameOt: goods.goods_option_name_ot || goods.goods_option_name || "",
    language: goods.language || "en",
    status: goods.status,
    price: goods.price.toString(),
    rePrice: goods.re_price.toString(),
    matterCodes: goods.matter_codes || "",
    num: goods.num,
    totalPrice: goods.total_price.toString(),
    lhImgPath: goods.lh_img_path || "",
    jsonCodeVal: goods.json_code_val, // CRITICAL: Production instructions
    path: goods.path || "",
    goodsPath: goods.goods_path || "",
    statusName: getStatusName(goods.status)
  };
}

/**
 * Get status name based on status code
 * Machine uses these for display and decision making
 */
function getStatusName(status) {
  const statusNames = {
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
 * GET ALL ORDERS SIMPLE - Quick endpoint to get all orders including completed ones
 * Added to existing route to avoid server restart
 */
router.post('/getAllOrdersSimple', async (req, res) => {
  try {
    console.log('📋 getAllOrdersSimple called');
    
    // Get ALL orders for device (including completed ones)
    const orders = db.db.prepare(`
      SELECT * FROM orders 
      WHERE device_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(1);
    
    console.log(`📋 Found ${orders.length} total orders for device 1`);

    // Transform orders to match the expected format
    const responseData = orders.map(order => {
      // Get all goods for this order
      const allGoods = db.getOrderGoodsForOrder(order.id);
      
      // Group goods by type
      const typeList1 = allGoods.filter(goods => goods.type === 1).map(goods => transformGoods(goods));
      const typeList2 = allGoods.filter(goods => goods.type === 2).map(goods => transformGoods(goods));
      const typeList3 = allGoods.filter(goods => goods.type === 3).map(goods => transformGoods(goods));
      const typeList4 = allGoods.filter(goods => goods.type === 4).map(goods => transformGoods(goods));

      // Calculate debug information
      const debugInfo = {
        orderId: order.id,
        deviceId: order.device_id,
        totalItems: allGoods.length,
        hasCancelledItems: allGoods.some(goods => goods.status === -1 || goods.status === 0),
        hasCompletedItems: allGoods.some(goods => goods.status === 5),
        hasProcessingItems: allGoods.some(goods => goods.status === 4),
        hasQueuingItems: allGoods.some(goods => goods.status === 3),
        createdAt: order.created_time,
        updatedAt: order.updated_time || order.created_time
      };

      return {
        id: order.id,
        num: order.num || 1,
        realPrice: order.real_price?.toString() || "0.00",
        status: order.status,
        orderNum: order.order_num,
        created_at: order.created_at,
        createdAt: order.created_time,
        statusName: getStatusName(order.status),
        typeList1,
        typeList2,
        typeList3,
        typeList4,
        debugInfo
      };
    });

    console.log(`✅ Returning ${responseData.length} orders with debug info`);
    
    res.json({
      code: 0,
      msg: "All orders retrieved successfully",
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in getAllOrdersSimple:', error);
    res.status(500).json({
      code: 500,
      msg: "Internal server error",
      data: []
    });
  }
});

module.exports = router;
