const express = require('express');
const Joi = require('joi');
const db = require('../database/db');
const currencyConfig = require('../config/currency');
const { checkMultipleProductsAvailability, getCurrentIngredientLevels, getAvailabilitySummary } = require('../utils/productAvailability');

const router = express.Router();

// Validation schema for product data
const productSchema = Joi.object({
  goodsId: Joi.number().integer().required(),
  deviceGoodsId: Joi.number().integer().required(),
  goodsName: Joi.string().required(),
  goodsNameEn: Joi.string().required(),
  goodsNameOt: Joi.string().allow(''),
  type: Joi.number().integer().min(1).max(4).required(),
  price: Joi.number().positive().required(),
  rePrice: Joi.number().positive().required(),
  matterCodes: Joi.string().allow(''),
  jsonCodeVal: Joi.string().required(),
  goodsImg: Joi.number().integer().allow(null),
  path: Joi.string().allow(''),
  goodsPath: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active'),
  // Customization options
  hasBeanOptions: Joi.boolean().default(false),
  hasMilkOptions: Joi.boolean().default(false),
  hasIceOptions: Joi.boolean().default(false),
  hasShotOptions: Joi.boolean().default(false),
  defaultBeanCode: Joi.number().integer().min(1).max(2).default(1),
  defaultMilkCode: Joi.number().integer().min(1).max(2).default(1),
  defaultIce: Joi.boolean().default(true),
  defaultShots: Joi.number().integer().min(1).max(2).default(1),
  // Kiosk display fields
  displayOrder: Joi.number().integer().min(0).default(0),
  category: Joi.string().max(50).default('Classics'),
  // Variant system fields
  icedClassCode: Joi.string().max(10).allow('', null).optional(),
  doubleShotClassCode: Joi.string().max(10).allow('', null).optional(),
  icedAndDoubleClassCode: Joi.string().max(10).allow('', null).optional()
});

/**
 * GET PRODUCTS - Get all products in catalog
 * For frontend Item Management page
 */
router.get('/products', async (req, res) => {
  try {
    console.log('📋 Get Products API called');
    
    const products = db.getAllProducts();
    
    console.log(`📦 Found ${products.length} products`);
    
    // Transform database products to frontend format
    const transformedProducts = products.map(product => ({
      id: product.id,
      goodsId: product.goods_id,
      deviceGoodsId: product.device_goods_id,
      goodsName: product.goods_name,
      goodsNameEn: product.goods_name_en,
      goodsNameOt: product.goods_name_ot,
      type: product.type,
      price: parseFloat(product.price),
      rePrice: parseFloat(product.re_price),
      matterCodes: product.matter_codes,
      jsonCodeVal: product.json_code_val,
      goodsImg: product.goods_img,
      path: product.path,
      goodsPath: product.goods_path,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      // Kiosk display fields
      displayOrder: product.display_order || 0,
      category: product.category || 'Classics',
      // Customization options
      has_bean_options: Boolean(product.has_bean_options),
      has_milk_options: Boolean(product.has_milk_options),
      has_ice_options: Boolean(product.has_ice_options),
      has_shot_options: Boolean(product.has_shot_options),
      default_bean_code: product.default_bean_code || 1,
      default_milk_code: product.default_milk_code || 1,
      defaultIce: Boolean(product.default_ice),
      default_shots: product.default_shots || 1,
      // Variant system classCodes
      icedClassCode: product.iced_class_code,
      doubleShotClassCode: product.double_shot_class_code,
      icedAndDoubleClassCode: product.iced_and_double_class_code
    }));

    // Get current ingredient levels for availability checking
    const currentIngredientLevels = getCurrentIngredientLevels(db);
    
    // Check ingredient availability for all products
    const availabilityMap = checkMultipleProductsAvailability(transformedProducts, currentIngredientLevels);
    
    // Add availability information to each product
    const productsWithAvailability = transformedProducts.map(product => ({
      ...product,
      // Ingredient availability information
      available: availabilityMap[product.goodsId]?.available ?? true,
      missingIngredients: availabilityMap[product.goodsId]?.missingIngredients ?? [],
      availabilityReason: availabilityMap[product.goodsId]?.reason ?? 'Unknown'
    }));
    
    // Get availability summary for logging
    const summary = getAvailabilitySummary(availabilityMap);
    console.log(`📊 Product Availability Summary:`, summary);

    res.json({
      code: 0,
      msg: 'Products retrieved successfully',
      data: productsWithAvailability,
      // Include availability summary in metadata
      meta: {
        availability: summary,
        ingredientLevelsChecked: Object.keys(currentIngredientLevels).length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error getting products:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error retrieving products',
      data: []
    });
  }
});

/**
 * POST CREATE PRODUCT - Create new product
 * For frontend Item Management creation
 */
router.post('/products', async (req, res) => {
  try {
    console.log('📝 Create Product API called');
    console.log('📥 Request body:', req.body);

    // Validate request data
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: -1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }

    // Check if goods_id already exists
    const existingProduct = db.getProductByGoodsId(value.goodsId);
    if (existingProduct) {
      return res.status(400).json({
        code: -1,
        msg: `Product with goods ID ${value.goodsId} already exists`,
        data: null
      });
    }

    // Create product
    const result = db.insertProduct(value);
    const productId = result.lastInsertRowid;
    
    console.log('✅ Product created with ID:', productId);

    // Return created product
    const createdProduct = db.getProductById(productId);
    
    res.json({
      code: 0,
      msg: 'Product created successfully',
      data: {
        id: createdProduct.id,
        goodsId: createdProduct.goods_id,
        deviceGoodsId: createdProduct.device_goods_id,
        goodsName: createdProduct.goods_name,
        goodsNameEn: createdProduct.goods_name_en,
        goodsNameOt: createdProduct.goods_name_ot,
        type: createdProduct.type,
        price: createdProduct.price.toString(),
        rePrice: createdProduct.re_price.toString(),
        matterCodes: createdProduct.matter_codes,
        jsonCodeVal: createdProduct.json_code_val,
        goodsImg: createdProduct.goods_img,
        path: createdProduct.path,
        goodsPath: createdProduct.goods_path,
        status: createdProduct.status,
        createdAt: createdProduct.created_at,
        updatedAt: createdProduct.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error creating product',
      data: null
    });
  }
});

/**
 * PUT UPDATE PRODUCT - Update existing product
 * For frontend Item Management editing
 */
router.put('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log(`📝 Update Product API called for ID: ${productId}`);
    console.log('📥 Request body:', req.body);

    // Check if product exists
    const existingProduct = db.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        code: -1,
        msg: 'Product not found',
        data: null
      });
    }

    // Validate request data (make all fields optional for updates, only validate what's provided)
    const updateSchema = Joi.object({
      goodsId: Joi.number().integer().optional(),
      deviceGoodsId: Joi.number().integer().optional(),
      goodsName: Joi.string().optional(),
      goodsNameEn: Joi.string().optional(),
      goodsNameOt: Joi.string().allow('').optional(),
      type: Joi.number().integer().min(1).max(4).optional(),
      price: Joi.alternatives().try(Joi.number().positive(), Joi.string()).optional(),
      rePrice: Joi.alternatives().try(Joi.number().positive(), Joi.string()).optional(),
      matterCodes: Joi.string().allow('').optional(),
      jsonCodeVal: Joi.string().optional(),
      goodsImg: Joi.number().integer().allow(null).optional(),
      path: Joi.string().allow('').optional(),
      goodsPath: Joi.string().allow('').optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      // Customization options
      hasBeanOptions: Joi.boolean().optional(),
      hasMilkOptions: Joi.boolean().optional(),
      hasIceOptions: Joi.boolean().optional(),
      hasShotOptions: Joi.boolean().optional(),
      defaultBeanCode: Joi.number().integer().min(1).max(2).optional(),
      defaultMilkCode: Joi.number().integer().min(1).max(2).optional(),
      defaultIce: Joi.boolean().optional(),
      defaultShots: Joi.number().integer().min(1).max(2).optional(),
      // Variant system fields
      icedClassCode: Joi.string().max(10).allow('', null).optional(),
      doubleShotClassCode: Joi.string().max(10).allow('', null).optional(),
      icedAndDoubleClassCode: Joi.string().max(10).allow('', null).optional(),
      // Allow additional fields that might come from frontend (like id, createdAt, updatedAt)
      id: Joi.number().integer().optional(),
      createdAt: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
      updatedAt: Joi.alternatives().try(Joi.date(), Joi.string()).optional()
    }).unknown(true); // Allow unknown fields to be passed through
    
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        code: -1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }

    // Update product
    db.updateProduct(productId, value);
    
    console.log('✅ Product updated successfully');

    // Return updated product
    const updatedProduct = db.getProductById(productId);
    
    res.json({
      code: 0,
      msg: 'Product updated successfully',
      data: {
        id: updatedProduct.id,
        goodsId: updatedProduct.goods_id,
        deviceGoodsId: updatedProduct.device_goods_id,
        goodsName: updatedProduct.goods_name,
        goodsNameEn: updatedProduct.goods_name_en,
        goodsNameOt: updatedProduct.goods_name_ot,
        type: updatedProduct.type,
        price: updatedProduct.price.toString(),
        rePrice: updatedProduct.re_price.toString(),
        matterCodes: updatedProduct.matter_codes,
        jsonCodeVal: updatedProduct.json_code_val,
        goodsImg: updatedProduct.goods_img,
        path: updatedProduct.path,
        goodsPath: updatedProduct.goods_path,
        status: updatedProduct.status,
        createdAt: updatedProduct.created_at,
        updatedAt: updatedProduct.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error updating product',
      data: null
    });
  }
});

/**
 * DELETE PRODUCT - Soft delete product
 * For frontend Item Management deletion
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log(`🗑️ Delete Product API called for ID: ${productId}`);

    // Check if product exists
    const existingProduct = db.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        code: -1,
        msg: 'Product not found',
        data: null
      });
    }

    // Soft delete product
    db.deleteProduct(productId);
    
    console.log('✅ Product deleted successfully');

    res.json({
      code: 0,
      msg: 'Product deleted successfully',
      data: null
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error deleting product',
      data: null
    });
  }
});

/**
 * GET PRODUCT BY ID - Get single product
 * For frontend product details
 */
router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log(`📋 Get Product API called for ID: ${productId}`);

    const product = db.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({
        code: -1,
        msg: 'Product not found',
        data: null
      });
    }

    res.json({
      code: 0,
      msg: 'Product retrieved successfully',
      data: {
        id: product.id,
        goodsId: product.goods_id,
        deviceGoodsId: product.device_goods_id,
        goodsName: product.goods_name,
        goodsNameEn: product.goods_name_en,
        goodsNameOt: product.goods_name_ot,
        type: product.type,
        price: product.price.toString(),
        rePrice: product.re_price.toString(),
        matterCodes: product.matter_codes,
        jsonCodeVal: product.json_code_val,
        goodsImg: product.goods_img,
        path: product.path,
        goodsPath: product.goods_path,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error getting product:', error);
    res.status(500).json({
      code: -1,
      msg: 'Error retrieving product',
      data: null
    });
  }
});

module.exports = router;