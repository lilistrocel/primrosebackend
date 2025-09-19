const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Joi = require('joi');

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  icon: Joi.string().max(10).default('☕'),
  display_order: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().default(true)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50),
  icon: Joi.string().max(10),
  display_order: Joi.number().integer().min(0),
  is_active: Joi.boolean()
}).min(1);

// GET /api/motong/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('📂 Categories API: GET /categories');
    
    const categories = db.getAllCategories();
    
    console.log(`📂 Found ${categories.length} categories`);
    
    res.json({
      code: 0,
      msg: "Request successfully",
      data: categories
    });
  } catch (error) {
    console.error('❌ Categories API: Error fetching categories:', error);
    res.status(500).json({
      code: 1,
      msg: "Internal server error",
      data: []
    });
  }
});

// POST /api/motong/categories - Create new category
router.post('/', async (req, res) => {
  try {
    console.log('📂 Categories API: POST /categories');
    console.log('📂 Request body:', req.body);
    
    // Validate input
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      console.error('❌ Categories API: Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }
    
    const result = db.insertCategory(value);
    
    console.log(`✅ Categories API: Created category with ID: ${result.lastInsertRowid}`);
    
    res.json({
      code: 0,
      msg: "Category created successfully",
      data: { id: result.lastInsertRowid, ...value }
    });
  } catch (error) {
    console.error('❌ Categories API: Error creating category:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        code: 1,
        msg: "Category name already exists",
        data: null
      });
    }
    
    res.status(500).json({
      code: 1,
      msg: "Internal server error",
      data: null
    });
  }
});

// PUT /api/motong/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    console.log(`📂 Categories API: PUT /categories/${categoryId}`);
    console.log('📂 Request body:', req.body);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        code: 1,
        msg: "Invalid category ID",
        data: null
      });
    }
    
    // Validate input
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) {
      console.error('❌ Categories API: Validation error:', error.details[0].message);
      return res.status(400).json({
        code: 1,
        msg: `Validation error: ${error.details[0].message}`,
        data: null
      });
    }
    
    const result = db.updateCategory(categoryId, value);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 1,
        msg: "Category not found",
        data: null
      });
    }
    
    console.log(`✅ Categories API: Updated category ${categoryId}`);
    
    res.json({
      code: 0,
      msg: "Category updated successfully",
      data: { id: categoryId, ...value }
    });
  } catch (error) {
    console.error('❌ Categories API: Error updating category:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        code: 1,
        msg: "Category name already exists",
        data: null
      });
    }
    
    res.status(500).json({
      code: 1,
      msg: "Internal server error",
      data: null
    });
  }
});

// DELETE /api/motong/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    console.log(`📂 Categories API: DELETE /categories/${categoryId}`);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        code: 1,
        msg: "Invalid category ID",
        data: null
      });
    }
    
    const result = db.deleteCategory(categoryId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 1,
        msg: "Category not found",
        data: null
      });
    }
    
    console.log(`✅ Categories API: Deleted category ${categoryId}`);
    
    res.json({
      code: 0,
      msg: "Category deleted successfully",
      data: null
    });
  } catch (error) {
    console.error('❌ Categories API: Error deleting category:', error);
    res.status(500).json({
      code: 1,
      msg: "Internal server error",
      data: null
    });
  }
});

module.exports = router;
