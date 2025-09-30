const fs = require('fs');
const path = require('path');

class InventoryMigration {
  constructor(db) {
    this.db = db;
  }

  run() {
    console.log('🔄 Running inventory system migrations...');

    try {
      // Check if inventory tables exist
      const tablesResult = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='inventory_items'
      `).get();

      if (!tablesResult) {
        console.log('📋 Creating inventory system tables...');
        this.createInventoryTables();
        this.insertDefaultInventoryItems();
        console.log('✅ Inventory system tables created successfully');
      } else {
        console.log('✅ Inventory system tables already exist');
      }

      return true;
    } catch (error) {
      console.error('❌ Inventory migration failed:', error);
      throw error;
    }
  }

  createInventoryTables() {
    const schemaPath = path.join(__dirname, 'inventory-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema - split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    this.db.transaction(() => {
      statements.forEach(statement => {
        if (statement.trim()) {
          this.db.exec(statement);
        }
      });
    })();
  }

  insertDefaultInventoryItems() {
    console.log('📦 Inserting default inventory items...');

    const defaultItems = [
      // Cups
      { 
        name: 'cup_8oz', 
        display_name: '8oz Cups', 
        category: 'cups', 
        unit: 'cups', 
        current_stock: 100, 
        max_stock: 500, 
        min_threshold: 50,
        cost_per_unit: 0.05
      },
      { 
        name: 'cup_12oz', 
        display_name: '12oz Cups', 
        category: 'cups', 
        unit: 'cups', 
        current_stock: 100, 
        max_stock: 500, 
        min_threshold: 50,
        cost_per_unit: 0.07
      },
      
      // Milk types
      { 
        name: 'milk_1', 
        display_name: 'Milk Type 1 (Regular)', 
        category: 'milk', 
        unit: 'ml', 
        current_stock: 2000, 
        max_stock: 5000, 
        min_threshold: 600,
        cost_per_unit: 0.001
      },
      { 
        name: 'milk_2', 
        display_name: 'Milk Type 2 (Alternative)', 
        category: 'milk', 
        unit: 'ml', 
        current_stock: 1500, 
        max_stock: 4000, 
        min_threshold: 500,
        cost_per_unit: 0.002
      },
      
      // Coffee beans
      { 
        name: 'coffee_beans_1', 
        display_name: 'Coffee Beans Type 1', 
        category: 'coffee_beans', 
        unit: 'grams', 
        current_stock: 2000, 
        max_stock: 5000, 
        min_threshold: 500,
        cost_per_unit: 0.05
      },
      { 
        name: 'coffee_beans_2', 
        display_name: 'Coffee Beans Type 2', 
        category: 'coffee_beans', 
        unit: 'grams', 
        current_stock: 1800, 
        max_stock: 5000, 
        min_threshold: 500,
        cost_per_unit: 0.06
      },
      
      // Water
      { 
        name: 'water', 
        display_name: 'Water', 
        category: 'water', 
        unit: 'ml', 
        current_stock: 10000, 
        max_stock: 20000, 
        min_threshold: 2000,
        cost_per_unit: 0.0001
      }
    ];

    defaultItems.forEach(item => {
      try {
        const query = `
          INSERT INTO inventory_items (
            name, display_name, category, unit, current_stock, max_stock, 
            min_threshold, cost_per_unit, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        this.db.prepare(query).run(
          item.name,
          item.display_name,
          item.category,
          item.unit,
          item.current_stock,
          item.max_stock,
          item.min_threshold,
          item.cost_per_unit,
          1
        );
        
        console.log(`✅ Inserted inventory item: ${item.display_name}`);
      } catch (error) {
        console.error(`❌ Failed to insert inventory item ${item.name}:`, error.message);
      }
    });

    // Create initial stock transactions for all items
    this.createInitialStockTransactions();
  }

  createInitialStockTransactions() {
    console.log('📊 Creating initial stock transactions...');

    const items = this.db.prepare('SELECT id, name, current_stock FROM inventory_items').all();
    
    items.forEach(item => {
      try {
        const query = `
          INSERT INTO inventory_transactions (
            item_id, transaction_type, quantity, unit_cost, total_cost, 
            reference_type, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        this.db.prepare(query).run(
          item.id,
          'top_up',
          item.current_stock,
          0, // No cost for initial stock
          0,
          'system',
          'Initial stock setup'
        );
        
        console.log(`✅ Created initial transaction for ${item.name}`);
      } catch (error) {
        console.error(`❌ Failed to create initial transaction for ${item.name}:`, error.message);
      }
    });
  }
}

module.exports = InventoryMigration;
