const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all inventory items
router.get('/items', (req, res) => {
  try {
    const items = db.inventory.getAllInventoryItems();
    res.json({
      code: 200,
      msg: 'Inventory items retrieved successfully',
      data: items
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch inventory items',
      data: []
    });
  }
});

// Get inventory item by ID
router.get('/items/:id', (req, res) => {
  try {
    const item = db.inventory.getInventoryItemById(req.params.id);
    if (!item) {
      return res.status(404).json({
        code: 404,
        msg: 'Inventory item not found',
        data: []
      });
    }
    
    res.json({
      code: 200,
      msg: 'Inventory item retrieved successfully',
      data: item
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch inventory item',
      data: []
    });
  }
});

// Create new inventory item
router.post('/items', (req, res) => {
  try {
    const { name, display_name, category, unit, current_stock, max_stock, min_threshold, cost_per_unit, supplier } = req.body;
    
    if (!name || !display_name || !category || !unit) {
      return res.status(400).json({
        code: 400,
        msg: 'Missing required fields: name, display_name, category, unit',
        data: []
      });
    }

    const result = db.inventory.createInventoryItem({
      name,
      display_name,
      category,
      unit,
      current_stock: current_stock || 0,
      max_stock: max_stock || 0,
      min_threshold: min_threshold || 0,
      cost_per_unit: cost_per_unit || 0,
      supplier: supplier || null
    });

    // Create initial stock transaction
    if (current_stock > 0) {
      db.inventory.createTransaction({
        item_id: result.lastInsertRowid,
        transaction_type: 'top_up',
        quantity: current_stock,
        reference_type: 'manual',
        notes: 'Initial stock setup'
      });
    }

    res.json({
      code: 200,
      msg: 'Inventory item created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to create inventory item',
      data: []
    });
  }
});

// Update inventory item
router.put('/items/:id', (req, res) => {
  try {
    const { display_name, category, unit, current_stock, max_stock, min_threshold, cost_per_unit, supplier, is_active } = req.body;
    
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (category !== undefined) updates.category = category;
    if (unit !== undefined) updates.unit = unit;
    if (current_stock !== undefined) updates.current_stock = current_stock;
    if (max_stock !== undefined) updates.max_stock = max_stock;
    if (min_threshold !== undefined) updates.min_threshold = min_threshold;
    if (cost_per_unit !== undefined) updates.cost_per_unit = cost_per_unit;
    if (supplier !== undefined) updates.supplier = supplier;
    if (is_active !== undefined) updates.is_active = is_active;

    const result = db.inventory.updateInventoryItem(req.params.id, updates);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        msg: 'Inventory item not found',
        data: []
      });
    }

    res.json({
      code: 200,
      msg: 'Inventory item updated successfully',
      data: { changes: result.changes }
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to update inventory item',
      data: []
    });
  }
});

// Delete inventory item (soft delete)
router.delete('/items/:id', (req, res) => {
  try {
    const result = db.inventory.deleteInventoryItem(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        msg: 'Inventory item not found',
        data: []
      });
    }

    res.json({
      code: 200,
      msg: 'Inventory item deleted successfully',
      data: { changes: result.changes }
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to delete inventory item',
      data: []
    });
  }
});

// Get inventory transactions
router.get('/transactions', (req, res) => {
  try {
    const { item_id, limit } = req.query;
    const transactions = db.inventory.getAllTransactions(
      item_id ? parseInt(item_id) : null,
      limit ? parseInt(limit) : 100
    );
    
    res.json({
      code: 200,
      msg: 'Transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch transactions',
      data: []
    });
  }
});

// Create inventory transaction (top up, adjustment, etc.)
router.post('/transactions', (req, res) => {
  try {
    const { item_id, transaction_type, quantity, unit_cost, reference_type, reference_id, notes } = req.body;
    
    if (!item_id || !transaction_type || !quantity) {
      return res.status(400).json({
        code: 400,
        msg: 'Missing required fields: item_id, transaction_type, quantity',
        data: []
      });
    }

    const total_cost = (unit_cost || 0) * quantity;
    
    const result = db.inventory.createTransaction({
      item_id: parseInt(item_id),
      transaction_type,
      quantity: parseFloat(quantity),
      unit_cost: unit_cost || 0,
      total_cost,
      reference_type: reference_type || 'manual',
      reference_id: reference_id || null,
      notes: notes || null
    });

    res.json({
      code: 200,
      msg: 'Transaction created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to create transaction',
      data: []
    });
  }
});

// Get product ingredients
router.get('/products/:productId/ingredients', (req, res) => {
  try {
    const ingredients = db.inventory.getProductIngredients(req.params.productId);
    
    res.json({
      code: 200,
      msg: 'Product ingredients retrieved successfully',
      data: ingredients
    });
  } catch (error) {
    console.error('Error fetching product ingredients:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch product ingredients',
      data: []
    });
  }
});

// Set product ingredients
router.post('/products/:productId/ingredients', (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        code: 400,
        msg: 'Ingredients must be an array',
        data: []
      });
    }

    db.inventory.setProductIngredients(req.params.productId, ingredients);
    
    res.json({
      code: 200,
      msg: 'Product ingredients updated successfully',
      data: []
    });
  } catch (error) {
    console.error('Error setting product ingredients:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to update product ingredients',
      data: []
    });
  }
});

// Get inventory alerts
router.get('/alerts', (req, res) => {
  try {
    const { resolved } = req.query;
    const resolvedFilter = resolved !== undefined ? resolved === 'true' : null;
    const alerts = db.inventory.getAllAlerts(resolvedFilter);
    
    res.json({
      code: 200,
      msg: 'Alerts retrieved successfully',
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch alerts',
      data: []
    });
  }
});

// Resolve alert
router.post('/alerts/:alertId/resolve', (req, res) => {
  try {
    const result = db.inventory.resolveAlert(req.params.alertId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        msg: 'Alert not found',
        data: []
      });
    }

    res.json({
      code: 200,
      msg: 'Alert resolved successfully',
      data: { changes: result.changes }
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to resolve alert',
      data: []
    });
  }
});

// Get inventory dashboard data
router.get('/dashboard', (req, res) => {
  try {
    const summary = db.inventory.getInventorySummary();
    const recentTransactions = db.inventory.getRecentTransactions(10);
    const lowStockItems = db.inventory.getLowStockItems();
    const alerts = db.inventory.getAllAlerts(false); // Only unresolved alerts
    
    res.json({
      code: 200,
      msg: 'Dashboard data retrieved successfully',
      data: {
        summary,
        recentTransactions,
        lowStockItems,
        alerts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch dashboard data',
      data: []
    });
  }
});

// Process order consumption (called when order is completed)
router.post('/process-order/:orderId', (req, res) => {
  try {
    const transactions = db.inventory.processOrderConsumption(req.params.orderId);
    
    res.json({
      code: 200,
      msg: 'Order consumption processed successfully',
      data: { transactions: transactions.length }
    });
  } catch (error) {
    console.error('Error processing order consumption:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to process order consumption',
      data: []
    });
  }
});

// Save product consumption configuration
router.post('/products/:productId/consumption-config', (req, res) => {
  try {
    const { milk_consumption, coffee_beans_consumption, cups_consumption, water_consumption } = req.body;
    
    if (milk_consumption === undefined || coffee_beans_consumption === undefined || 
        cups_consumption === undefined || water_consumption === undefined) {
      return res.status(400).json({
        code: 400,
        msg: 'Missing required fields: milk_consumption, coffee_beans_consumption, cups_consumption, water_consumption',
        data: []
      });
    }

    const result = db.inventory.saveProductConsumptionConfig(req.params.productId, {
      milk_consumption,
      coffee_beans_consumption,
      cups_consumption,
      water_consumption
    });

    res.json({
      code: 200,
      msg: 'Product consumption configuration saved successfully',
      data: { changes: result.changes }
    });
  } catch (error) {
    console.error('Error saving consumption config:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to save consumption configuration',
      data: []
    });
  }
});

// Get product consumption configuration
router.get('/products/:productId/consumption-config', (req, res) => {
  try {
    const config = db.inventory.getProductConsumptionConfig(req.params.productId);
    
    res.json({
      code: 200,
      msg: 'Product consumption configuration retrieved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error fetching consumption config:', error);
    res.status(500).json({
      code: 500,
      msg: 'Failed to fetch consumption configuration',
      data: []
    });
  }
});

module.exports = router;
