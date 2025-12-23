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
 * This endpoint is continuously polled by machines to check for active orders
 * - Coffee machines look for items in typeList2 (type === 2)
 * - Ice cream machines look for items in typeList3 (type === 3)
 * - Other machines can use typeList1 (milk tea) or typeList4 (other)
 */
router.post('/deviceOrderQueueList', async (req, res) => {
  try {
    console.log('🤖 deviceOrderQueueList called with:', req.body);
    
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
    const deviceIdNum = parseInt(deviceId);
    
    // Map device IDs to machine types for better logging
    const deviceTypeMap = {
      1: 'Coffee Machine',
      4: 'Ice Cream Machine'
    };
    const machineType = deviceTypeMap[deviceIdNum] || `Device ${deviceIdNum}`;
    
    // Get active orders with goods in single query (OPTIMIZED - prevents N+1)
    const orders = db.getAllOrdersWithGoods(deviceIdNum);
    console.log(`📋 ${machineType} (device ${deviceId}) polling: Found ${orders.length} active orders`);

    // Check if test mode is enabled
    const isTestMode = db.isTestMode();
    console.log(`🧪 Test Mode: ${isTestMode ? 'ENABLED' : 'DISABLED'}`);

    // Transform orders to exact API response format
    const responseData = orders.map(order => {
      // Goods already loaded from single query
      const allGoods = order.goods;
      
      // Group goods by type (1=奶茶, 2=咖啡, 3=冰淇淋, 4=其他)
      // Coffee machines read typeList2, Ice cream machines read typeList3
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
        realPrice: parseFloat(order.real_price).toFixed(2),
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

    // Log summary of items by type for machine debugging
    const totalType1 = responseData.reduce((sum, o) => sum + o.typeList1.length, 0);
    const totalType2 = responseData.reduce((sum, o) => sum + o.typeList2.length, 0);
    const totalType3 = responseData.reduce((sum, o) => sum + o.typeList3.length, 0);
    const totalType4 = responseData.reduce((sum, o) => sum + o.typeList4.length, 0);
    console.log(`✅ ${machineType} (device ${deviceId}): Returning ${responseData.length} orders`);
    console.log(`   📊 Items breakdown: ${totalType1} milk tea, ${totalType2} coffee, ${totalType3} ice cream, ${totalType4} other`);
    
    // Warn if machine is polling for wrong type
    if (deviceIdNum === 4 && totalType3 === 0 && (totalType2 > 0 || totalType1 > 0 || totalType4 > 0)) {
      console.log(`⚠️ Ice Cream Machine (device 4) found non-ice-cream items. Ensure orders are created with deviceId 4.`);
    } else if (deviceIdNum === 1 && totalType2 === 0 && totalType3 > 0) {
      console.log(`⚠️ Coffee Machine (device 1) found ice cream items. These should be on device 4.`);
    }
    
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
    price: parseFloat(goods.price).toFixed(2),
    rePrice: parseFloat(goods.re_price).toFixed(2),
    matterCodes: goods.matter_codes || "",
    num: goods.num,
    totalPrice: parseFloat(goods.total_price).toFixed(2),
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
