const Database = require('better-sqlite3');
const path = require('path');

class InventoryDatabase {
  constructor(db) {
    this.db = db;
  }

  // Inventory Items Management
  getAllInventoryItems() {
    try {
      const query = `
        SELECT * FROM inventory_items 
        WHERE is_active = 1 
        ORDER BY category, display_name
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  getInventoryItemById(id) {
    try {
      const query = `SELECT * FROM inventory_items WHERE id = ? AND is_active = 1`;
      return this.db.prepare(query).get(id);
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  getInventoryItemByName(name) {
    try {
      const query = `SELECT * FROM inventory_items WHERE name = ? AND is_active = 1`;
      return this.db.prepare(query).get(name);
    } catch (error) {
      console.error('Error fetching inventory item by name:', error);
      throw error;
    }
  }

  createInventoryItem(itemData) {
    try {
      const query = `
        INSERT INTO inventory_items (
          name, display_name, category, unit, current_stock, max_stock,
          min_threshold, cost_per_unit, supplier, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      return this.db.prepare(query).run(
        itemData.name,
        itemData.display_name,
        itemData.category,
        itemData.unit,
        itemData.current_stock || 0,
        itemData.max_stock || 0,
        itemData.min_threshold || 0,
        itemData.cost_per_unit || 0,
        itemData.supplier || null,
        itemData.is_active !== undefined ? itemData.is_active : 1
      );
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  updateInventoryItem(id, updates) {
    try {
      const allowedFields = [
        'display_name', 'category', 'unit', 'current_stock', 'max_stock',
        'min_threshold', 'cost_per_unit', 'supplier', 'is_active'
      ];
      
      const updateFields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `
        UPDATE inventory_items 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      return this.db.prepare(query).run(...values);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  deleteInventoryItem(id) {
    try {
      const query = `
        UPDATE inventory_items 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      return this.db.prepare(query).run(id);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Inventory Transactions Management
  getAllTransactions(itemId = null, limit = 100) {
    try {
      let query = `
        SELECT it.*, ii.display_name as item_name, ii.unit
        FROM inventory_transactions it
        JOIN inventory_items ii ON it.item_id = ii.id
      `;
      
      const params = [];
      if (itemId) {
        query += ` WHERE it.item_id = ?`;
        params.push(itemId);
      }
      
      query += ` ORDER BY it.created_at DESC LIMIT ?`;
      params.push(limit);
      
      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  createTransaction(transactionData) {
    try {
      const query = `
        INSERT INTO inventory_transactions (
          item_id, transaction_type, quantity, unit_cost, total_cost,
          reference_type, reference_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = this.db.prepare(query).run(
        transactionData.item_id,
        transactionData.transaction_type,
        transactionData.quantity,
        transactionData.unit_cost || 0,
        transactionData.total_cost || 0,
        transactionData.reference_type || null,
        transactionData.reference_id || null,
        transactionData.notes || null
      );

      // Update current stock based on transaction type
      this.updateItemStock(transactionData.item_id, transactionData.transaction_type, transactionData.quantity);

      // Return the created transaction data
      return {
        id: result.lastInsertRowId,
        item_id: transactionData.item_id,
        transaction_type: transactionData.transaction_type,
        quantity: transactionData.quantity,
        unit_cost: transactionData.unit_cost || 0,
        total_cost: transactionData.total_cost || 0,
        reference_type: transactionData.reference_type || null,
        reference_id: transactionData.reference_id || null,
        notes: transactionData.notes || null,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  updateItemStock(itemId, transactionType, quantity) {
    try {
      let stockChange = 0;
      
      switch (transactionType) {
        case 'top_up':
        case 'adjustment':
          stockChange = quantity;
          break;
        case 'order_consumption':
        case 'waste':
          stockChange = -quantity;
          break;
        default:
          console.log(`Unknown transaction type: ${transactionType}`);
          return;
      }

      const query = `
        UPDATE inventory_items 
        SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = this.db.prepare(query).run(stockChange, itemId);
      
      // Check for alerts after stock update
      this.checkAndCreateAlerts(itemId);
      
      return result;
    } catch (error) {
      console.error('Error updating item stock:', error);
      throw error;
    }
  }

  // Product Ingredients Management
  getProductIngredients(productId) {
    try {
      const query = `
        SELECT pi.*, ii.display_name, ii.unit, ii.current_stock
        FROM product_ingredients pi
        JOIN inventory_items ii ON pi.ingredient_id = ii.id
        WHERE pi.product_id = ? AND ii.is_active = 1
        ORDER BY pi.ingredient_id
      `;
      return this.db.prepare(query).all(productId);
    } catch (error) {
      console.error('Error fetching product ingredients:', error);
      throw error;
    }
  }

  setProductIngredients(productId, ingredients) {
    try {
      // Remove existing ingredients for this product
      this.db.prepare('DELETE FROM product_ingredients WHERE product_id = ?').run(productId);
      
      // Add new ingredients
      if (ingredients && ingredients.length > 0) {
        const query = `
          INSERT INTO product_ingredients (product_id, ingredient_id, quantity_per_unit, unit, is_optional)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        const stmt = this.db.prepare(query);
        
        ingredients.forEach(ingredient => {
          stmt.run(
            productId,
            ingredient.ingredient_id,
            ingredient.quantity_per_unit,
            ingredient.unit,
            ingredient.is_optional || 0
          );
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting product ingredients:', error);
      throw error;
    }
  }

  // Inventory Alerts Management
  checkAndCreateAlerts(itemId) {
    try {
      const item = this.getInventoryItemById(itemId);
      if (!item) return;

      // Check for low stock alert
      if (item.current_stock <= item.min_threshold) {
        this.createAlert({
          item_id: itemId,
          alert_type: item.current_stock <= 0 ? 'out_of_stock' : 'low_stock',
          threshold_value: item.min_threshold,
          current_value: item.current_stock,
          message: item.current_stock <= 0 
            ? `${item.display_name} is out of stock!`
            : `${item.display_name} is running low (${item.current_stock} ${item.unit} remaining)`
        });
      }

      // Check for overstock alert (if current stock > 101% of max stock)
      if (item.max_stock > 0 && item.current_stock > (item.max_stock * 1.01)) {
        this.createAlert({
          item_id: itemId,
          alert_type: 'overstock',
          threshold_value: item.max_stock * 1.01,
          current_value: item.current_stock,
          message: `${item.display_name} is overstocked (${item.current_stock} ${item.unit} in stock)`
        });
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  createAlert(alertData) {
    try {
      // Check if similar alert already exists and is unresolved
      const existingAlert = this.db.prepare(`
        SELECT id FROM inventory_alerts 
        WHERE item_id = ? AND alert_type = ? AND is_resolved = 0
      `).get(alertData.item_id, alertData.alert_type);

      if (existingAlert) {
        // Update existing alert
        const query = `
          UPDATE inventory_alerts 
          SET current_value = ?, message = ?, created_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        this.db.prepare(query).run(alertData.current_value, alertData.message, existingAlert.id);
      } else {
        // Create new alert
        const query = `
          INSERT INTO inventory_alerts (
            item_id, alert_type, threshold_value, current_value, message
          ) VALUES (?, ?, ?, ?, ?)
        `;
        this.db.prepare(query).run(
          alertData.item_id,
          alertData.alert_type,
          alertData.threshold_value,
          alertData.current_value,
          alertData.message
        );
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  getAllAlerts(resolved = null) {
    try {
      let query = `
        SELECT ia.*, ii.display_name as item_name, ii.unit
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.item_id = ii.id
      `;
      
      const params = [];
      if (resolved !== null) {
        query += ` WHERE ia.is_resolved = ?`;
        params.push(resolved ? 1 : 0);
      }
      
      query += ` ORDER BY ia.created_at DESC`;
      
      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  resolveAlert(alertId) {
    try {
      const query = `
        UPDATE inventory_alerts 
        SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      return this.db.prepare(query).run(alertId);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Order Processing Integration
  processOrderConsumption(orderId) {
    try {
      // Get order goods with their jsonCodeVal
      const orderGoods = this.db.prepare(`
        SELECT og.*, p.goods_name_en
        FROM order_goods og
        JOIN products p ON og.goods_id = p.id
        WHERE og.order_id = ?
      `).all(orderId);

      const transactions = [];

      for (const orderItem of orderGoods) {
        console.log(`🔄 Processing consumption for ${orderItem.goods_name_en}`);
        console.log(`📦 Order item jsonCodeVal: ${orderItem.json_code_val}`);
        
        // Parse jsonCodeVal to get ingredient codes
        const ingredientCodes = this.parseJsonCodeVal(orderItem.json_code_val);
        console.log(`🔍 Parsed ingredient codes:`, ingredientCodes);
        
        // Process consumption based on ingredient codes
        const itemTransactions = this.processConsumptionByCodes(
          orderItem, 
          ingredientCodes, 
          orderId
        );
        
        transactions.push(...itemTransactions);
      }

      return transactions;
    } catch (error) {
      console.error('Error processing order consumption:', error);
      throw error;
    }
  }

  // Parse jsonCodeVal to extract ingredient codes
  parseJsonCodeVal(jsonCodeVal) {
    if (!jsonCodeVal) return {};
    
    try {
      const codes = {};
      const jsonArray = JSON.parse(jsonCodeVal);
      
      jsonArray.forEach(item => {
        // Handle BeanCode
        if (item.BeanCode) {
          codes.beanCode = parseInt(item.BeanCode);
        }
        
        // Handle MilkCode
        if (item.MilkCode) {
          codes.milkCode = parseInt(item.MilkCode);
        }
        
        // Handle CupCode
        if (item.CupCode) {
          codes.cupCode = parseInt(item.CupCode);
        }
      });
      
      // Water is always consumed (80ml default)
      codes.hasWater = true;
      
      return codes;
    } catch (error) {
      console.error('Error parsing jsonCodeVal:', error);
      return {};
    }
  }

  // Parse matter codes to extract ingredient codes (legacy method)
  parseMatterCodes(matterCodes) {
    if (!matterCodes) return {};
    
    const codes = {};
    const codeArray = matterCodes.split(',').map(code => code.trim());
    
    codeArray.forEach(code => {
      // Handle CoffeeMatter format (CoffeeMatter1, CoffeeMatter2, etc.)
      if (code.includes('CoffeeMatter')) {
        const matterNumber = parseInt(code.replace('CoffeeMatter', ''));
        
        // Map CoffeeMatter numbers to appropriate codes based on ingredient mapping
        if (matterNumber === 1) {
          codes.cupCode = 1; // 8oz Paper Cups
        } else if (matterNumber === 2) {
          codes.beanCode = 1; // Coffee Beans Type 1
        } else if (matterNumber === 3) {
          codes.milkCode = 1; // Milk Type 1 (Regular)
        } else if (matterNumber === 5) {
          // Coffee Machine Water - handled separately as default
          codes.hasWater = true;
        } else if (matterNumber === 10) {
          codes.cupCode = 3; // 12oz Paper Cups
        } else if (matterNumber === 13) {
          codes.beanCode = 2; // Coffee Beans Type 2
        } else if (matterNumber === 14) {
          codes.milkCode = 2; // Milk Type 2 (Alternative)
        }
      }
      // Handle BeanCode format (BeanCode1, BeanCode2)
      else if (code.includes('BeanCode')) {
        codes.beanCode = parseInt(code.replace('BeanCode', ''));
      }
      // Handle MilkCode format (MilkCode1, MilkCode2)
      else if (code.includes('MilkCode')) {
        codes.milkCode = parseInt(code.replace('MilkCode', ''));
      }
      // Handle CupCode format (CupCode1, CupCode2, CupCode3)
      else if (code.includes('CupCode')) {
        codes.cupCode = parseInt(code.replace('CupCode', ''));
      }
    });
    
    return codes;
  }

  // Process consumption based on ingredient codes
  processConsumptionByCodes(orderItem, ingredientCodes, orderId) {
    const transactions = [];
    
    // Get all inventory items for mapping
    const inventoryItems = this.getAllInventoryItems();
    
    // Get product consumption configuration
    const consumptionConfig = this.getProductConsumptionConfig(orderItem.goods_id);
    
    // Map ingredient codes to inventory items
    const itemMapping = {
      'BeanCode1': 'coffee_beans_1',
      'BeanCode2': 'coffee_beans_2',
      'MilkCode1': 'milk_1',
      'MilkCode2': 'milk_2',
      'CupCode1': 'cup_8oz',
      'CupCode2': 'cup_8oz',
      'CupCode3': 'cup_12oz'
    };
    
    // Process bean consumption
    if (ingredientCodes.beanCode) {
      const beanKey = `BeanCode${ingredientCodes.beanCode}`;
      const inventoryItemName = itemMapping[beanKey];
      
      if (inventoryItemName) {
        const inventoryItem = inventoryItems.find(item => item.name === inventoryItemName);
        if (inventoryItem) {
          // Use configured consumption or fallback to default
          const quantity = consumptionConfig ? 
            consumptionConfig.coffee_beans_consumption : 
            this.getBeanConsumptionQuantity(orderItem.goods_name_en);
            
          if (quantity > 0) {
            const transaction = this.createTransaction({
              item_id: inventoryItem.id,
              transaction_type: 'order_consumption',
              quantity: quantity * orderItem.num,
              reference_type: 'order',
              reference_id: orderId,
              notes: `Consumed for ${orderItem.goods_name_en} (BeanCode${ingredientCodes.beanCode})`
            });
            transactions.push(transaction);
            console.log(`✅ Bean consumption: ${quantity * orderItem.num}g of ${inventoryItem.display_name}`);
          }
        }
      }
    }
    
    // Process milk consumption
    if (ingredientCodes.milkCode) {
      const milkKey = `MilkCode${ingredientCodes.milkCode}`;
      const inventoryItemName = itemMapping[milkKey];
      
      if (inventoryItemName) {
        const inventoryItem = inventoryItems.find(item => item.name === inventoryItemName);
        if (inventoryItem) {
          // Use configured consumption or fallback to default
          const quantity = consumptionConfig ? 
            consumptionConfig.milk_consumption : 
            this.getMilkConsumptionQuantity(orderItem.goods_name_en);
            
          if (quantity > 0) {
            const transaction = this.createTransaction({
              item_id: inventoryItem.id,
              transaction_type: 'order_consumption',
              quantity: quantity * orderItem.num,
              reference_type: 'order',
              reference_id: orderId,
              notes: `Consumed for ${orderItem.goods_name_en} (MilkCode${ingredientCodes.milkCode})`
            });
            transactions.push(transaction);
            console.log(`✅ Milk consumption: ${quantity * orderItem.num}ml of ${inventoryItem.display_name}`);
          }
        }
      }
    }
    
    // Process cup consumption
    if (ingredientCodes.cupCode) {
      const cupKey = `CupCode${ingredientCodes.cupCode}`;
      const inventoryItemName = itemMapping[cupKey];
      
      if (inventoryItemName) {
        const inventoryItem = inventoryItems.find(item => item.name === inventoryItemName);
        if (inventoryItem) {
          // Use configured consumption or fallback to default (1 cup)
          const quantity = consumptionConfig ? 
            consumptionConfig.cups_consumption : 
            1;
            
          const transaction = this.createTransaction({
            item_id: inventoryItem.id,
            transaction_type: 'order_consumption',
            quantity: quantity * orderItem.num,
            reference_type: 'order',
            reference_id: orderId,
            notes: `Consumed for ${orderItem.goods_name_en} (CupCode${ingredientCodes.cupCode})`
          });
          transactions.push(transaction);
          console.log(`✅ Cup consumption: ${quantity * orderItem.num} of ${inventoryItem.display_name}`);
        }
      }
    }
    
    // Process water consumption (always 80ml for all drinks)
    if (ingredientCodes.hasWater) {
      const waterItem = inventoryItems.find(item => item.name === 'water');
      if (waterItem) {
        const transaction = this.createTransaction({
          item_id: waterItem.id,
          transaction_type: 'order_consumption',
          quantity: 80 * orderItem.num, // Always 80ml per drink
          reference_type: 'order',
          reference_id: orderId,
          notes: `Consumed for ${orderItem.goods_name_en} (water - 80ml default)`
        });
        transactions.push(transaction);
        console.log(`✅ Water consumption: ${80 * orderItem.num}ml of ${waterItem.display_name} (80ml default)`);
      }
    }
    
    return transactions;
  }

  // Product Consumption Configuration Management
  saveProductConsumptionConfig(productId, config) {
    try {
      // Check if configuration already exists
      const existing = this.db.prepare(`
        SELECT id FROM product_consumption_config 
        WHERE product_id = ?
      `).get(productId);

      if (existing) {
        // Update existing configuration
        const query = `
          UPDATE product_consumption_config 
          SET milk_consumption = ?, coffee_beans_consumption = ?, 
              cups_consumption = ?, water_consumption = ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `;
        return this.db.prepare(query).run(
          config.milk_consumption,
          config.coffee_beans_consumption,
          config.cups_consumption,
          config.water_consumption,
          productId
        );
      } else {
        // Insert new configuration
        const query = `
          INSERT INTO product_consumption_config 
          (product_id, milk_consumption, coffee_beans_consumption, cups_consumption, water_consumption)
          VALUES (?, ?, ?, ?, ?)
        `;
        return this.db.prepare(query).run(
          productId,
          config.milk_consumption,
          config.coffee_beans_consumption,
          config.cups_consumption,
          config.water_consumption
        );
      }
    } catch (error) {
      console.error('Error saving product consumption config:', error);
      throw error;
    }
  }

  getProductConsumptionConfig(productId) {
    try {
      const query = `
        SELECT * FROM product_consumption_config 
        WHERE product_id = ?
      `;
      return this.db.prepare(query).get(productId);
    } catch (error) {
      console.error('Error fetching product consumption config:', error);
      throw error;
    }
  }

  // Get bean consumption quantity based on product type
  getBeanConsumptionQuantity(productName) {
    const name = productName.toLowerCase();
    
    // Standard coffee bean consumption (in grams)
    if (name.includes('espresso')) return 18;
    if (name.includes('americano')) return 18;
    if (name.includes('latte')) return 18;
    if (name.includes('cappuccino')) return 18;
    if (name.includes('cortado')) return 18;
    
    // Default consumption
    return 18;
  }

  // Get milk consumption quantity based on product type
  getMilkConsumptionQuantity(productName) {
    const name = productName.toLowerCase();
    
    // Milk consumption in ml
    if (name.includes('espresso')) return 0; // No milk
    if (name.includes('americano')) return 0; // No milk
    if (name.includes('latte')) return 200;
    if (name.includes('cappuccino')) return 150;
    if (name.includes('cortado')) return 100;
    
    // Default consumption
    return 200;
  }

  // Dashboard Data
  getInventorySummary() {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as total_items,
          SUM(current_stock) as total_stock,
          SUM(max_stock) as total_capacity,
          COUNT(CASE WHEN current_stock <= min_threshold THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN current_stock <= 0 THEN 1 END) as out_of_stock_items
        FROM inventory_items 
        WHERE is_active = 1
        GROUP BY category
        ORDER BY category
      `;
      
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }

  getRecentTransactions(limit = 20) {
    try {
      const query = `
        SELECT it.*, ii.display_name as item_name, ii.unit
        FROM inventory_transactions it
        JOIN inventory_items ii ON it.item_id = ii.id
        ORDER BY it.created_at DESC
        LIMIT ?
      `;
      
      return this.db.prepare(query).all(limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  getLowStockItems() {
    try {
      const query = `
        SELECT * FROM inventory_items 
        WHERE is_active = 1 AND current_stock <= min_threshold
        ORDER BY (current_stock / min_threshold) ASC
      `;
      
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }
}

module.exports = InventoryDatabase;
