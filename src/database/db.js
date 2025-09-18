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
      
      // Initialize database schema
      this.initializeSchema();
      
      console.log(`✅ Database connected: ${dbPath}`);
    } catch (error) {
      console.error(`❌ Database connection error:`, error);
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
          path, goods_path, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        productData.status || 'active'
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
        defaultShots: 'default_shots'
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
    console.log('🗑️ All data cleared');
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
