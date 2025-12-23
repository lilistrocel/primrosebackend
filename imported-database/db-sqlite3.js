// Windows-compatible database manager using sqlite3 instead of better-sqlite3
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    try {
      // Create database file in project root
      const dbPath = path.join(__dirname, '../../coffee_machine.db');
      console.log(`🔄 Attempting to connect to database: ${dbPath}`);
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          throw err;
        }
        console.log(`✅ Database connected: ${dbPath}`);
        
        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('❌ Error enabling foreign keys:', err);
          } else {
            console.log('✅ Foreign keys enabled');
          }
        });
        
        // Initialize database schema
        this.initializeSchema();
      });
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
      
      let completed = 0;
      const total = statements.length;
      
      statements.forEach((statement, index) => {
        if (statement.trim()) {
          this.db.run(statement, (err) => {
            if (err) {
              console.error(`❌ Error executing statement ${index + 1}:`, err);
            }
            completed++;
            if (completed === total) {
              console.log('✅ Database schema initialized');
            }
          });
        } else {
          completed++;
        }
      });
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
      throw error;
    }
  }

  // Promisify database operations for consistent API
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Order operations (converted to async)
  async getAllOrdersForDevice(deviceId = 1) {
    const sql = `
      SELECT * FROM orders 
      WHERE device_id = ? AND status IN (3, 4) 
      ORDER BY created_at ASC
    `;
    return await this.all(sql, [deviceId]);
  }

  async getOrderGoodsForOrder(orderId) {
    const sql = `
      SELECT * FROM order_goods 
      WHERE order_id = ? 
      ORDER BY id ASC
    `;
    return await this.all(sql, [orderId]);
  }

  async getOrderByOrderNum(orderNum) {
    const sql = `
      SELECT * FROM orders 
      WHERE order_num = ?
    `;
    return await this.get(sql, [orderNum]);
  }

  async updateOrderGoodsStatus(orderGoodsId, status) {
    const sql = `
      UPDATE order_goods 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    return await this.run(sql, [status, orderGoodsId]);
  }

  async updateOrderStatus(orderId, status) {
    const sql = `
      UPDATE orders 
      SET status = ?, updated_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    return await this.run(sql, [status, orderId]);
  }

  // Device status operations
  async saveDeviceStatus(deviceId, matterStatusJson, deviceStatusJson) {
    const sql = `
      INSERT INTO device_status (device_id, matter_status_json, device_status_json)
      VALUES (?, ?, ?)
    `;
    return await this.run(sql, [deviceId, matterStatusJson, deviceStatusJson]);
  }

  async getLatestDeviceStatus(deviceId = 1) {
    const sql = `
      SELECT * FROM device_status 
      WHERE device_id = ? 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    return await this.get(sql, [deviceId]);
  }

  // Insert operations for mock data
  async insertOrder(orderData) {
    const sql = `
      INSERT INTO orders (
        device_id, order_num, uid, num, real_price, pay_money, status,
        created_at, created_time, updated_time, pay_time, queue_time, make_time, success_time,
        payment_intent, name, address, guomao_code, guomao_channel, guomao_used_user, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.run(sql, [
      orderData.deviceId, orderData.orderNum, orderData.uid, orderData.num,
      orderData.realPrice, orderData.payMoney, orderData.status,
      orderData.createdAt, orderData.createdTime, orderData.updatedTime,
      orderData.payTime, orderData.queueTime, orderData.makeTime, orderData.successTime,
      orderData.paymentIntent, orderData.name, orderData.address, orderData.guomaoCode,
      orderData.guomaoChannel, orderData.guomaoUsedUser, orderData.language
    ]);
  }

  async insertOrderGoods(goodsData) {
    const sql = `
      INSERT INTO order_goods (
        order_id, device_goods_id, goods_id, goods_name, goods_name_en, goods_name_ot,
        goods_img, goods_option_name, goods_option_name_en, goods_option_name_ot,
        type, status, price, re_price, matter_codes, num, total_price,
        lh_img_path, json_code_val, path, goods_path, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.run(sql, [
      goodsData.orderId, goodsData.deviceGoodsId, goodsData.goodsId,
      goodsData.goodsName, goodsData.goodsNameEn, goodsData.goodsNameOt,
      goodsData.goodsImg, goodsData.goodsOptionName, goodsData.goodsOptionNameEn,
      goodsData.goodsOptionNameOt, goodsData.type, goodsData.status,
      goodsData.price, goodsData.rePrice, goodsData.matterCodes,
      goodsData.num, goodsData.totalPrice, goodsData.lhImgPath,
      goodsData.jsonCodeVal, goodsData.path, goodsData.goodsPath, goodsData.language
    ]);
  }

  // Products management methods
  async getAllProducts() {
    try {
      const sql = `
        SELECT * FROM products 
        WHERE status != 'deleted'
        ORDER BY type, goods_name_en
      `;
      return await this.all(sql);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const sql = `SELECT * FROM products WHERE id = ? AND status != 'deleted'`;
      return await this.get(sql, [id]);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  async getProductByGoodsId(goodsId) {
    try {
      const sql = `SELECT * FROM products WHERE goods_id = ? AND status != 'deleted'`;
      return await this.get(sql, [goodsId]);
    } catch (error) {
      console.error('Error fetching product by goods ID:', error);
      throw error;
    }
  }

  async insertProduct(productData) {
    try {
      const sql = `
        INSERT INTO products (
          goods_id, device_goods_id, goods_name, goods_name_en, goods_name_ot,
          type, price, re_price, matter_codes, json_code_val, goods_img,
          path, goods_path, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      return await this.run(sql, [
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
      ]);
    } catch (error) {
      console.error('Error inserting product:', error);
      throw error;
    }
  }

  async updateProduct(id, updates) {
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

      // Build the SET clause dynamically
      Object.keys(updates).forEach(key => {
        // Skip id, createdAt, updatedAt fields
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
      
      const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
      console.log('🔄 Update query:', sql);
      console.log('📝 Update values:', values);
      
      const result = await this.run(sql, values);
      console.log('✅ Update executed successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const sql = `UPDATE products SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      return await this.run(sql, [id]);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Utility methods
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // For testing - clear all data
  async clearAllData() {
    await this.run('DELETE FROM order_goods');
    await this.run('DELETE FROM orders');
    await this.run('DELETE FROM device_status');
    await this.run('DELETE FROM products');
    console.log('🗑️ All data cleared');
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
