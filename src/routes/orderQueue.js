const express = require('express');
const Joi = require('joi');
const db = require('../database/db');

const router = express.Router();

// Validation schema for orderQueue request
const orderQueueSchema = Joi.object({
  orderNum: Joi.string().required(),
  deviceId: Joi.string().required(),
  type: Joi.number().integer().valid(0, 1).required()
});

/**
 * ORDER QUEUE - Queue management endpoint
 * Less frequently used by machine, but required for compatibility
 * Updates order to queuing status when scanned
 */
router.post('/orderQueue', async (req, res) => {
  try {
    console.log('📋 orderQueue called with:', req.body);
    
    // Validate request
    const { error, value } = orderQueueSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters',
        data: []
      });
    }

    const { orderNum, deviceId, type } = value;
    
    // Find order by order number
    const order = db.db.prepare('SELECT * FROM orders WHERE order_num = ? AND device_id = ?').get(orderNum, parseInt(deviceId));
    
    if (!order) {
      console.log(`❌ Order not found: ${orderNum} for device ${deviceId}`);
      return res.status(404).json({
        code: 404,
        msg: 'Order not found',
        data: {}
      });
    }

    // Update order to queuing status (3) if it's paid (2)
    if (order.status === 2) {
      const updateResult = db.updateOrderStatus(order.id, 3); // Set to Queuing
      
      // Also update all order goods to queuing status
      const goodsUpdateResult = db.db.prepare('UPDATE order_goods SET status = 3 WHERE order_id = ?').run(order.id);
      
      console.log(`✅ Order ${orderNum} queued successfully (${goodsUpdateResult.changes} items updated)`);
    }

    // Get updated order data with all goods
    const updatedOrder = db.db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const allGoods = db.getOrderGoodsForOrder(order.id);
    
    // Group goods by type for response
    const typeList1 = allGoods.filter(goods => goods.type === 1).map(goods => transformGoods(goods));
    const typeList2 = allGoods.filter(goods => goods.type === 2).map(goods => transformGoods(goods));
    const typeList3 = allGoods.filter(goods => goods.type === 3).map(goods => transformGoods(goods));
    const typeList4 = allGoods.filter(goods => goods.type === 4).map(goods => transformGoods(goods));

    // Build response data - exact format from API documentation
    const responseData = {
      id: updatedOrder.id,
      deviceId: updatedOrder.device_id,
      orderNum: updatedOrder.order_num,
      uid: updatedOrder.uid,
      num: updatedOrder.num,
      payMoney: updatedOrder.pay_money ? updatedOrder.pay_money.toString() : "0.00",
      guomaoCode: updatedOrder.guomao_code || "",
      status: updatedOrder.status,
      payTime: updatedOrder.pay_time || "1970-01-01 00:00:00",
      queueTime: updatedOrder.queue_time || "1970-01-01 00:00:00",
      makeTime: updatedOrder.make_time || "1970-01-01 00:00:00",
      successTime: updatedOrder.success_time || "1970-01-01 00:00:00",
      payment_intent: updatedOrder.payment_intent || "",
      name: updatedOrder.name || "",
      address: updatedOrder.address || "",
      guomaoChannel: updatedOrder.guomao_channel || "",
      guomaoUsedUser: updatedOrder.guomao_used_user || "",
      createdTime: updatedOrder.created_time,
      updatedTime: updatedOrder.updated_time,
      typeList4: typeList4,
      typeList3: typeList3,
      typeList2: typeList2,
      typeList1: typeList1
    };

    // Return exact API response format
    const response = {
      code: 0,
      msg: "Order queued successfully; please wait while we prepare your order.",
      data: responseData
    };

    console.log(`✅ Order ${orderNum} queued and response sent`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in orderQueue:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error',
      data: {}
    });
  }
});

/**
 * Transform order goods to exact API response format
 */
function transformGoods(goods) {
  return {
    id: goods.id,
    deviceGoodsId: goods.device_goods_id,
    type: goods.type,
    orderId: goods.order_id,
    goodsId: goods.goods_id,
    goodsName: goods.goods_name,
    goodsImg: goods.goods_img,
    goodsOptionName: goods.goods_option_name || "",
    status: goods.status,
    price: goods.price.toString(),
    rePrice: goods.re_price.toString(),
    matterCodes: goods.matter_codes || "",
    num: goods.num,
    totalPrice: goods.total_price.toString(),
    lhImgPath: goods.lh_img_path || "",
    jsonCodeVal: goods.json_code_val,
    path: goods.path || "",
    goodsPath: goods.goods_path || "",
    statusName: getStatusName(goods.status)
  };
}

/**
 * Get status name based on status code
 */
function getStatusName(status) {
  const statusNames = {
    1: "Unpaid",
    2: "To be used", 
    3: "Queuing",
    4: "Processing",
    5: "Completed",
    '-1': "Cancelled",
    '-3': "Refunded"
  };
  
  return statusNames[status] || "Unknown";
}

module.exports = router;
