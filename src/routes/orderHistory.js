const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

// Validation schema for orderHistory request
const orderHistorySchema = Joi.object({
  deviceId: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(1000).default(50),
  offset: Joi.number().integer().min(0).default(0),
  status: Joi.string().optional(), // Filter by status
  dateFrom: Joi.string().optional(), // ISO date string
  dateTo: Joi.string().optional() // ISO date string
});

/**
 * GET ORDER HISTORY - For debugging and monitoring past orders
 * This endpoint provides detailed order history with filtering options
 */
router.post('/orderHistory', async (req, res) => {
  try {
    console.log('📋 orderHistory called with:', req.body);
    
    // Validate request
    const { error, value } = orderHistorySchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters',
        data: []
      });
    }

    const { deviceId, limit, offset, status, dateFrom, dateTo } = value;
    
    // Build query with filters
    let query = `
      SELECT * FROM orders 
      WHERE device_id = ?
    `;
    const params = [parseInt(deviceId)];
    
    // Add status filter if provided
    if (status) {
      query += ` AND status = ?`;
      params.push(parseInt(status));
    }
    
    // Add date filters if provided
    if (dateFrom) {
      const fromTimestamp = Math.floor(new Date(dateFrom).getTime() / 1000);
      query += ` AND created_at >= ?`;
      params.push(fromTimestamp);
    }
    
    if (dateTo) {
      const toTimestamp = Math.floor(new Date(dateTo).getTime() / 1000);
      query += ` AND created_at <= ?`;
      params.push(toTimestamp);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    console.log('🔍 Executing query:', query);
    console.log('📊 Parameters:', params);
    
    // Get orders with filters
    const orders = db.db.prepare(query).all(...params);
    console.log(`📋 Found ${orders.length} orders matching criteria`);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total FROM orders 
      WHERE device_id = ?
    `;
    const countParams = [parseInt(deviceId)];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(parseInt(status));
    }
    
    if (dateFrom) {
      const fromTimestamp = Math.floor(new Date(dateFrom).getTime() / 1000);
      countQuery += ` AND created_at >= ?`;
      countParams.push(fromTimestamp);
    }
    
    if (dateTo) {
      const toTimestamp = Math.floor(new Date(dateTo).getTime() / 1000);
      countQuery += ` AND created_at <= ?`;
      countParams.push(toTimestamp);
    }
    
    const totalResult = db.db.prepare(countQuery).get(...countParams);
    const total = totalResult.total;

    // Transform orders to include detailed information
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
        createdAt: new Date(order.created_at * 1000).toISOString(),
        updatedAt: order.updated_time,
        payTime: order.pay_time,
        queueTime: order.queue_time,
        makeTime: order.make_time,
        successTime: order.success_time
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
      msg: "Order history retrieved successfully",
      data: responseData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('❌ Error in orderHistory:', error);
    res.status(500).json({
      code: 500,
      msg: "Internal server error",
      data: []
    });
  }
});

/**
 * GET ORDER DETAILS - Get detailed information for a specific order
 */
router.post('/orderDetails', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        code: 400,
        msg: 'Order ID is required',
        data: null
      });
    }

    // Get order details
    const order = db.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({
        code: 404,
        msg: 'Order not found',
        data: null
      });
    }

    // Get all goods for this order
    const allGoods = db.getOrderGoodsForOrder(order.id);
    
    // Get inventory transactions for this order
    const transactions = db.db.prepare(`
      SELECT it.*, ii.display_name, ii.unit 
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.item_id = ii.id
      WHERE it.reference_id = ? AND it.reference_type = 'order'
      ORDER BY it.created_at DESC
    `).all(order.id);

    const debugInfo = {
      order: {
        id: order.id,
        orderNum: order.order_num,
        deviceId: order.device_id,
        status: order.status,
        statusName: getStatusName(order.status),
        realPrice: order.real_price,
        payMoney: order.pay_money,
        createdAt: order.created_time,
        updatedAt: order.updated_time,
        payTime: order.pay_time,
        queueTime: order.queue_time,
        makeTime: order.make_time,
        successTime: order.success_time,
        paymentIntent: order.payment_intent,
        name: order.name,
        address: order.address,
        language: order.language
      },
      items: allGoods.map(goods => ({
        id: goods.id,
        goodsId: goods.goods_id,
        goodsName: goods.goods_name,
        goodsNameEn: goods.goods_name_en,
        type: goods.type,
        status: goods.status,
        statusName: getStatusName(goods.status),
        price: goods.price,
        quantity: goods.num,
        totalPrice: goods.total_price,
        matterCodes: goods.matter_codes,
        jsonCodeVal: goods.json_code_val,
        createdAt: goods.created_at,
        updatedAt: goods.updated_at
      })),
      inventoryTransactions: transactions.map(t => ({
        id: t.id,
        itemName: t.display_name,
        unit: t.unit,
        transactionType: t.transaction_type,
        quantity: t.quantity,
        totalCost: t.total_cost,
        notes: t.notes,
        createdAt: t.created_at
      }))
    };

    res.json({
      code: 0,
      msg: "Order details retrieved successfully",
      data: debugInfo
    });

  } catch (error) {
    console.error('❌ Error in orderDetails:', error);
    res.status(500).json({
      code: 500,
      msg: "Internal server error",
      data: null
    });
  }
});

/**
 * Transform order goods to API response format
 */
function transformGoods(goods) {
  return {
    id: goods.id,
    deviceGoodsId: goods.device_goods_id || goods.id,
    type: goods.type,
    orderId: goods.order_id,
    goodsId: goods.goods_id,
    goodsName: goods.goods_name,
    goodsImg: goods.goods_img || 0,
    goodsOptionName: goods.goods_option_name || "",
    status: goods.status,
    price: goods.price?.toString() || "0.00",
    rePrice: goods.re_price?.toString() || "0.00",
    matterCodes: goods.matter_codes || "",
    num: goods.num || 1,
    totalPrice: goods.total_price?.toString() || "0.00",
    lhImgPath: goods.lh_img_path || "",
    jsonCodeVal: goods.json_code_val || "[]",
    path: goods.path || "",
    goodsPath: goods.goods_path || "",
    statusName: getStatusName(goods.status)
  };
}

/**
 * Get status name from status code
 */
function getStatusName(status) {
  const statusNames = {
    0: "Cancelled",
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

module.exports = router;
