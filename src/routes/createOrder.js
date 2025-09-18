const express = require('express');
const Joi = require('joi');
const db = require('../database/db');
const networkConfig = require('../config/network');

const router = express.Router();

// Middleware to log all requests to this router
router.use('*', (req, res, next) => {
  console.log(`🔍 createOrder ROUTER: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 Body: ${JSON.stringify(req.body)}`);
  next();
});

// Test route to verify router is working
router.post('/test', (req, res) => {
  console.log('🧪 TEST ROUTE HIT!');
  res.json({ success: true, message: 'createOrder router is working!' });
});

// Validation schema for createOrder request
const createOrderSchema = Joi.object({
  orderNum: Joi.string().required(),
  deviceId: Joi.number().integer().default(1),
  totalPrice: Joi.number().positive().required(),
  items: Joi.array().items(
    Joi.object({
      goodsId: Joi.number().integer().required(),
      deviceGoodsId: Joi.number().integer().required(),
      goodsName: Joi.string().required(),
      goodsNameEn: Joi.string().required(),
      goodsNameOt: Joi.string().allow(''),
      type: Joi.number().integer().min(1).max(4).required(),
      price: Joi.number().positive().required(),
      rePrice: Joi.number().positive().required(),
      quantity: Joi.number().integer().min(1).required(),
      totalPrice: Joi.number().positive().required(),
      matterCodes: Joi.string().allow(''),
      jsonCodeVal: Joi.string().required(),
      goodsOptionName: Joi.string().allow(''),
      goodsOptionNameEn: Joi.string().allow('')
    })
  ).min(1).required()
});

/**
 * CREATE ORDER - New endpoint for frontend order creation
 * Allows users to create new orders through the management interface
 */
router.post('/createOrder', async (req, res) => {
  try {
    console.log('🔥 createOrder ENDPOINT HIT! 🔥');
    console.log('🛒 createOrder called with:', req.body);
    
    // Validate request
    console.log('📋 Validating request body...');
    console.log('📤 Raw body:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      console.log('❌ Full validation error:', error.details);
      console.log('❌ Failed field path:', error.details[0].path);
      console.log('❌ Failed field value:', error.details[0].context);
      return res.status(400).json({
        code: 400,
        msg: 'Invalid request parameters: ' + error.details[0].message,
        data: []
      });
    }
    
    console.log('✅ Validation passed!');

    const { orderNum, deviceId, totalPrice, items } = value;
    
    // Check if order number already exists
    const existingOrder = db.getOrderByOrderNum(orderNum);
    if (existingOrder) {
      console.log('❌ Order number already exists:', orderNum);
      return res.status(400).json({
        code: 400,
        msg: 'Order number already exists',
        data: []
      });
    }

    // Generate timestamps
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);

    // Create main order record
    const orderData = {
      deviceId: deviceId,
      orderNum: orderNum,
      uid: null,
      num: items.reduce((sum, item) => sum + item.quantity, 0),
      realPrice: totalPrice,
      payMoney: totalPrice,
      status: 3, // Queuing (ready for machine)
      createdAt: timestamp,
      createdTime: now.toISOString().slice(0, 19).replace('T', ' '),
      updatedTime: now.toISOString().slice(0, 19).replace('T', ' '),
      payTime: now.toISOString().slice(0, 19).replace('T', ' '),
      queueTime: '1970-01-01 00:00:00',
      makeTime: '1970-01-01 00:00:00',
      successTime: '1970-01-01 00:00:00',
      paymentIntent: null,
      name: 'Coffee Manager',
      address: 'Local Machine',
      guomaoCode: '',
      guomaoChannel: 'FRONTEND',
      guomaoUsedUser: 'ADMIN',
      language: 'en'
    };

    console.log('📝 Creating order:', orderData);
    const orderResult = db.insertOrder(orderData);
    const orderId = orderResult.lastInsertRowid;
    
    console.log('✅ Order created with ID:', orderId);

    // Create order goods records
    const createdItems = [];
    for (const item of items) {
      const goodsData = {
        orderId: orderId,
        deviceGoodsId: item.deviceGoodsId,
        goodsId: item.goodsId,
        goodsName: item.goodsName,
        goodsNameEn: item.goodsNameEn,
        goodsNameOt: item.goodsNameOt || '',
        goodsImg: 1, // Default image ID
        goodsOptionName: item.goodsOptionName || '',
        goodsOptionNameEn: item.goodsOptionNameEn || '',
        goodsOptionNameOt: item.goodsOptionNameEn || '',
        type: item.type,
        status: 3, // Queuing
        price: item.price,
        rePrice: item.rePrice,
        matterCodes: item.matterCodes || '',
        num: item.quantity,
        totalPrice: item.totalPrice,
        lhImgPath: '',
        jsonCodeVal: item.jsonCodeVal,
        path: `public/uploads/product_${item.goodsId}.png`,
        goodsPath: `${networkConfig.getFrontendApiUrl()}/public/uploads/product_${item.goodsId}.png`,
        language: 'en'
      };

      console.log('📦 Creating order item:', goodsData);
      const goodsResult = db.insertOrderGoods(goodsData);
      createdItems.push({
        id: goodsResult.lastInsertRowid,
        ...goodsData
      });
      
      console.log('✅ Order item created with ID:', goodsResult.lastInsertRowid);
    }

    // Log successful order creation
    console.log(`🎉 Order ${orderNum} created successfully!`);
    console.log(`📊 Order Summary:`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Order Number: ${orderNum}`);
    console.log(`   Device ID: ${deviceId}`);
    console.log(`   Total Items: ${items.length}`);
    console.log(`   Total Price: $${totalPrice.toFixed(2)}`);
    console.log(`   Status: Queuing (ready for machine)`);

    // Return successful response
    res.json({
      code: 0,
      msg: 'Order created successfully',
      data: {
        orderId: orderId,
        orderNum: orderNum,
        status: 3,
        statusName: 'Queuing',
        totalPrice: totalPrice,
        itemCount: items.length,
        items: createdItems
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      code: 500,
      msg: 'Internal server error while creating order',
      data: []
    });
  }
});

module.exports = router;
