const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    try {
      // Create database file in project root
      const dbPath = path.join(__dirname, '../../coffee_machine.db');
      console.log(`🔄 Attempting to connect to database: ${dbPath}`);
      
      this.db = new Database(dbPath);
      console.log(`✅ Database object created`);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      console.log(`✅ Foreign keys enabled`);
      
      // Run migrations first (safely adds new columns to existing tables)
      this.runMigrations();
      
      // Initialize database schema only if tables don't exist
      this.initializeSchemaIfNeeded();
      
      console.log(`✅ Database connected: ${dbPath}`);
    } catch (error) {
      console.error(`❌ Database connection error:`, error);
      throw error;
    }
  }

  runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
      // Check if categories table exists
      const tablesResult = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='categories'
      `).get();

      if (!tablesResult) {
        console.log('📋 Creating categories table...');
        this.db.exec(`
          CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            icon VARCHAR(10) DEFAULT '☕',
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Insert default categories
        const defaultCategories = [
          { name: 'Classics', icon: '☕', display_order: 0 },
          { name: 'Latte Art', icon: '🎨', display_order: 1 },
          { name: 'Specialty', icon: '⭐', display_order: 2 },
          { name: 'Cold Brew', icon: '🧊', display_order: 3 },
          { name: 'Seasonal', icon: '🍂', display_order: 4 }
        ];

        defaultCategories.forEach(category => {
          try {
            const query = `
              INSERT INTO categories (name, icon, display_order, is_active)
              VALUES (?, ?, ?, ?)
            `;
            this.db.prepare(query).run(
              category.name,
              category.icon || '☕',
              category.display_order || 0,
              1
            );
            console.log(`✅ Inserted default category: ${category.name}`);
          } catch (error) {
            console.error(`❌ Failed to insert category ${category.name}:`, error.message);
          }
        });
      }

      // Check if products table has new columns
      const columnsResult = this.db.prepare(`PRAGMA table_info(products)`).all();
      const hasCategory = columnsResult.some(col => col.name === 'category');
      const hasDisplayOrder = columnsResult.some(col => col.name === 'display_order');

      if (!hasCategory) {
        console.log('📋 Adding category column to products table...');
        this.db.exec(`ALTER TABLE products ADD COLUMN category VARCHAR(50) DEFAULT 'Classics'`);
      }

      if (!hasDisplayOrder) {
        console.log('📋 Adding display_order column to products table...');
        this.db.exec(`ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0`);
      }

      // Create indexes if they don't exist
      console.log('📋 Creating new indexes...');
      try {
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order)`);
      } catch (error) {
        console.log('📋 Indexes may already exist, continuing...');
      }

      console.log('✅ Database migrations completed successfully!');
      return true;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  initializeSchemaIfNeeded() {
    try {
      // Check if main tables exist
      const tablesExist = this.db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type='table' AND name IN ('orders', 'order_goods', 'products', 'device_status')
      `).get();
      
      if (tablesExist.count < 4) {
        console.log('📋 Tables missing, initializing database schema...');
        this.initializeSchema();
        
        // Insert mock data only for new databases
        console.log('📦 Inserting initial mock data...');
        const MockDataGenerator = require('./mock-data');
        MockDataGenerator.insertMockData();
      } else {
        console.log('✅ Database tables already exist, skipping initialization');
      }
    } catch (error) {
      console.error('❌ Error checking database schema:', error);
      throw error;
    }
  }

  initializeSchema() {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
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
      
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
      throw error;
    }
  }

  // Order operations
  getAllOrdersForDevice(deviceId = 1) {
    const stmt = this.db.prepare(`
      SELECT * FROM orders 
      WHERE device_id = ? AND status IN (3, 4) 
      ORDER BY created_at ASC
    `);
    return stmt.all(deviceId);
  }

  getOrderGoodsForOrder(orderId) {
    const stmt = this.db.prepare(`
      SELECT * FROM order_goods 
      WHERE order_id = ? 
      ORDER BY id ASC
    `);
    return stmt.all(orderId);
  }

  getOrderByOrderNum(orderNum) {
    const stmt = this.db.prepare(`
      SELECT * FROM orders 
      WHERE order_num = ?
    `);
    return stmt.get(orderNum);
  }

  updateOrderGoodsStatus(orderGoodsId, status) {
    const stmt = this.db.prepare(`
      UPDATE order_goods 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    return stmt.run(status, orderGoodsId);
  }

  updateOrderStatus(orderId, status) {
    const stmt = this.db.prepare(`
      UPDATE orders 
      SET status = ?, updated_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    return stmt.run(status, orderId);
  }

  // Device status operations
  saveDeviceStatus(deviceId, matterStatusJson, deviceStatusJson) {
    const stmt = this.db.prepare(`
      INSERT INTO device_status (device_id, matter_status_json, device_status_json)
      VALUES (?, ?, ?)
    `);
    return stmt.run(deviceId, matterStatusJson, deviceStatusJson);
  }

  getLatestDeviceStatus(deviceId = 1) {
    const stmt = this.db.prepare(`
      SELECT * FROM device_status 
      WHERE device_id = ? 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    return stmt.get(deviceId);
  }

  // Insert operations for mock data
  insertOrder(orderData) {
    const stmt = this.db.prepare(`
      INSERT INTO orders (
        device_id, order_num, uid, num, real_price, pay_money, status,
        created_at, created_time, updated_time, pay_time, queue_time, make_time, success_time,
        payment_intent, name, address, guomao_code, guomao_channel, guomao_used_user, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      orderData.deviceId, orderData.orderNum, orderData.uid, orderData.num,
      orderData.realPrice, orderData.payMoney, orderData.status,
      orderData.createdAt, orderData.createdTime, orderData.updatedTime,
      orderData.payTime, orderData.queueTime, orderData.makeTime, orderData.successTime,
      orderData.paymentIntent, orderData.name, orderData.address, orderData.guomaoCode,
      orderData.guomaoChannel, orderData.guomaoUsedUser, orderData.language
    );
  }

  insertOrderGoods(goodsData) {
    const stmt = this.db.prepare(`
      INSERT INTO order_goods (
        order_id, device_goods_id, goods_id, goods_name, goods_name_en, goods_name_ot,
        goods_img, goods_option_name, goods_option_name_en, goods_option_name_ot,
        type, status, price, re_price, matter_codes, num, total_price,
        lh_img_path, json_code_val, path, goods_path, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      goodsData.orderId, goodsData.deviceGoodsId, goodsData.goodsId,
      goodsData.goodsName, goodsData.goodsNameEn, goodsData.goodsNameOt,
      goodsData.goodsImg, goodsData.goodsOptionName, goodsData.goodsOptionNameEn,
      goodsData.goodsOptionNameOt, goodsData.type, goodsData.status,
      goodsData.price, goodsData.rePrice, goodsData.matterCodes,
      goodsData.num, goodsData.totalPrice, goodsData.lhImgPath,
      goodsData.jsonCodeVal, goodsData.path, goodsData.goodsPath, goodsData.language
    );
  }

  // Products management methods
  getAllProducts() {
    try {
      const query = `
        SELECT * FROM products 
        WHERE status != 'deleted'
        ORDER BY type, goods_name_en
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  getProductById(id) {
    try {
      const query = `SELECT * FROM products WHERE id = ? AND status != 'deleted'`;
      return this.db.prepare(query).get(id);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  getProductByGoodsId(goodsId) {
    try {
      const query = `SELECT * FROM products WHERE goods_id = ? AND status != 'deleted'`;
      return this.db.prepare(query).get(goodsId);
    } catch (error) {
      console.error('Error fetching product by goods ID:', error);
      throw error;
    }
  }

  insertProduct(productData) {
    try {
      const query = `
        INSERT INTO products (
          goods_id, device_goods_id, goods_name, goods_name_en, goods_name_ot,
          type, price, re_price, matter_codes, json_code_val, goods_img,
          path, goods_path, status, display_order, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      return this.db.prepare(query).run(
        productData.goodsId,
        productData.deviceGoodsId,
        productData.goodsName,
        productData.goodsNameEn,
        productData.goodsNameOt || '',
        productData.type,
        productData.price,
        productData.rePrice,
        productData.matterCodes || '',
        productData.jsonCodeVal,
        productData.goodsImg || null,
        productData.path || '',
        productData.goodsPath || '',
        productData.status || 'active',
        productData.displayOrder || 0,
        productData.category || 'Classics'
      );
    } catch (error) {
      console.error('Error inserting product:', error);
      throw error;
    }
  }

  updateProduct(id, productData) {
    try {
      const query = `
        UPDATE products SET
          goods_name = ?, goods_name_en = ?, goods_name_ot = ?,
          type = ?, price = ?, re_price = ?, matter_codes = ?,
          json_code_val = ?, goods_img = ?, path = ?, goods_path = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      return this.db.prepare(query).run(
        productData.goodsName,
        productData.goodsNameEn,
        productData.goodsNameOt || '',
        productData.type,
        productData.price,
        productData.rePrice,
        productData.matterCodes || '',
        productData.jsonCodeVal,
        productData.goodsImg || null,
        productData.path || '',
        productData.goodsPath || '',
        productData.status || 'active',
        id
      );
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  updateProduct(id, updates) {
    try {
      // Build dynamic update query based on provided fields
      const updateFields = [];
      const values = [];
      
      // Map frontend field names to database field names
      const fieldMapping = {
        goodsId: 'goods_id',
        deviceGoodsId: 'device_goods_id',
        goodsName: 'goods_name',
        goodsNameEn: 'goods_name_en',
        goodsNameOt: 'goods_name_ot',
        rePrice: 're_price',
        matterCodes: 'matter_codes',
        jsonCodeVal: 'json_code_val',
        goodsImg: 'goods_img',
        goodsPath: 'goods_path',
        hasBeanOptions: 'has_bean_options',
        hasMilkOptions: 'has_milk_options',
        hasIceOptions: 'has_ice_options',
        hasShotOptions: 'has_shot_options',
        defaultBeanCode: 'default_bean_code',
        defaultMilkCode: 'default_milk_code',
        defaultIce: 'default_ice',
        defaultShots: 'default_shots',
        displayOrder: 'display_order',
        category: 'category'
      };
      
      // Handle ID change specially (dangerous operation)
      let idChangeQuery = null;
      let newId = null;
      if (updates.id && updates.id !== id) {
        newId = updates.id;
        console.log(`⚠️ WARNING: Attempting to change product ID from ${id} to ${newId}`);
        
        // Check if new ID already exists
        const existingProduct = this.getProductById(newId);
        if (existingProduct) {
          throw new Error(`Product with ID ${newId} already exists`);
        }
        
        idChangeQuery = `UPDATE products SET id = ? WHERE id = ?`;
      }

      // Build the SET clause dynamically
      Object.keys(updates).forEach(key => {
        // Skip id, createdAt, updatedAt fields (id handled separately above)
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
          return;
        }
        
        const dbField = fieldMapping[key] || key;
        updateFields.push(`${dbField} = ?`);
        
        // Convert boolean values to integers for SQLite compatibility
        let value = updates[key];
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        
        values.push(value);
      });
      
      if (updateFields.length === 0) {
        console.log('⚠️ No valid fields to update');
        return { changes: 0 };
      }
      
      // Always update the updated_at timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id); // Add ID for WHERE clause
      
      const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
      console.log('🔄 Update query:', query);
      console.log('📝 Update values:', values);
      
      const stmt = this.db.prepare(query);
      console.log('✅ Statement prepared successfully');
      
      const result = stmt.run(...values);
      console.log('✅ Update executed successfully:', result);
      
      // Execute ID change if needed (must be done after other updates)
      if (idChangeQuery && newId) {
        console.log(`🔄 Executing ID change: ${id} → ${newId}`);
        const idStmt = this.db.prepare(idChangeQuery);
        const idResult = idStmt.run(newId, id);
        console.log('✅ ID change executed successfully:', idResult);
        
        // Return the result with the new ID
        return { ...result, newId: newId };
      }
      
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  deleteProduct(id) {
    try {
      const query = `UPDATE products SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      return this.db.prepare(query).run(id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Utility methods
  close() {
    this.db.close();
  }

  // For testing - clear all data
  clearAllData() {
    this.db.exec('DELETE FROM order_goods');
    this.db.exec('DELETE FROM orders');
    this.db.exec('DELETE FROM device_status');
    this.db.exec('DELETE FROM products');
    this.db.exec('DELETE FROM categories');
    console.log('🗑️ All data cleared');
  }

  // Category management methods
  insertCategory(categoryData) {
    try {
      const query = `
        INSERT INTO categories (name, icon, display_order, is_active)
        VALUES (?, ?, ?, ?)
      `;
      
      return this.db.prepare(query).run(
        categoryData.name,
        categoryData.icon || '☕',
        categoryData.display_order || 0,
        categoryData.is_active !== undefined ? categoryData.is_active : 1
      );
    } catch (error) {
      console.error('Error inserting category:', error);
      throw error;
    }
  }

  getAllCategories() {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE is_active = 1 
        ORDER BY display_order, name
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  updateCategory(id, categoryData) {
    try {
      const query = `
        UPDATE categories SET
          name = ?, icon = ?, display_order = ?, is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      return this.db.prepare(query).run(
        categoryData.name,
        categoryData.icon,
        categoryData.display_order,
        categoryData.is_active,
        id
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  deleteCategory(id) {
    try {
      // First update all products using this category to use 'Classics'
      const updateProductsQuery = `
        UPDATE products SET category = 'Classics' 
        WHERE category = (SELECT name FROM categories WHERE id = ?)
      `;
      this.db.prepare(updateProductsQuery).run(id);

      // Then soft delete the category
      const query = `UPDATE categories SET is_active = 0 WHERE id = ?`;
      return this.db.prepare(query).run(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
