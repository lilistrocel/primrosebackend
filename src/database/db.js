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

      // Initialize database schema first (create tables if they don't exist)
      this.initializeSchemaIfNeeded();

      // Run migrations (safely adds new columns to existing tables)
      this.runMigrations();

      // Run inventory migrations
      this.runInventoryMigrations();
      
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
          { name: 'Seasonal', icon: '🍂', display_order: 4 },
          { name: 'Ice Cream', icon: '🍦', display_order: 5 }
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

      // Add Ice Cream category if it doesn't exist (for existing databases)
      try {
        const iceCreamCategory = this.db.prepare(`SELECT id FROM categories WHERE name = 'Ice Cream'`).get();
        if (!iceCreamCategory) {
          this.db.prepare(`INSERT INTO categories (name, icon, display_order, is_active) VALUES (?, ?, ?, ?)`).run('Ice Cream', '🍦', 5, 1);
          console.log('🍦 Added Ice Cream category');
        }
      } catch (error) {
        console.log('⚠️ Ice Cream category migration:', error.message);
      }

      // Add performance index for order_goods JOIN (if not exists)
      try {
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_order_goods_order_id
          ON order_goods(order_id)
        `);
        console.log('✅ Performance index on order_goods.order_id ensured');
      } catch (error) {
        console.log('⚠️ Index might already exist:', error.message);
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

      // Add variant system columns for alternative classCodes
      const variantColumns = ['iced_class_code', 'double_shot_class_code', 'iced_and_double_class_code'];
      
      variantColumns.forEach(columnName => {
        const hasColumn = columnsResult.some(col => col.name === columnName);
        if (!hasColumn) {
          console.log(`📋 Adding ${columnName} column to products table...`);
          this.db.exec(`ALTER TABLE products ADD COLUMN ${columnName} VARCHAR(10) DEFAULT NULL`);
        }
      });

      // Add latte art printing option
      const hasLatteArt = columnsResult.some(col => col.name === 'has_latte_art');
      if (!hasLatteArt) {
        console.log('🎨 Adding has_latte_art column to products table...');
        this.db.exec(`ALTER TABLE products ADD COLUMN has_latte_art BOOLEAN DEFAULT 0`);
      }

      // Add ice cream topping options columns
      const hasToppingOptions = columnsResult.some(col => col.name === 'has_topping_options');
      if (!hasToppingOptions) {
        console.log('🍦 Adding has_topping_options column to products table...');
        this.db.exec(`ALTER TABLE products ADD COLUMN has_topping_options BOOLEAN DEFAULT 0`);
      }

      const hasDefaultToppingType = columnsResult.some(col => col.name === 'default_topping_type');
      if (!hasDefaultToppingType) {
        console.log('🍦 Adding default_topping_type column to products table...');
        this.db.exec(`ALTER TABLE products ADD COLUMN default_topping_type INTEGER DEFAULT 0`);
      }

      // Add ice cream syrup variant columns for alternative classCodes
      const syrupVariantColumns = ['syrup1_class_code', 'syrup2_class_code', 'syrup3_class_code'];

      syrupVariantColumns.forEach(columnName => {
        const hasColumn = columnsResult.some(col => col.name === columnName);
        if (!hasColumn) {
          console.log(`🍦 Adding ${columnName} column to products table...`);
          this.db.exec(`ALTER TABLE products ADD COLUMN ${columnName} VARCHAR(20) DEFAULT NULL`);
        }
      });

      // Create latte art designs table
      const latteArtTable = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='latte_art_designs'
      `).get();

      if (!latteArtTable) {
        console.log('🎨 Creating latte_art_designs table...');
        this.db.exec(`
          CREATE TABLE latte_art_designs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            image_path VARCHAR(255) NOT NULL,
            is_default BOOLEAN DEFAULT 1,
            is_active BOOLEAN DEFAULT 1,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Insert some default latte art designs
        const defaultDesigns = [
          { name: 'Heart', description: 'Classic heart design', image_path: '/public/uploads/latte-art/heart.png', display_order: 1 },
          { name: 'Leaf', description: 'Beautiful leaf pattern', image_path: '/public/uploads/latte-art/leaf.png', display_order: 2 },
          { name: 'Tulip', description: 'Elegant tulip design', image_path: '/public/uploads/latte-art/tulip.png', display_order: 3 },
          { name: 'Rose', description: 'Intricate rose pattern', image_path: '/public/uploads/latte-art/rose.png', display_order: 4 }
        ];

        defaultDesigns.forEach(design => {
          try {
            const query = `
              INSERT INTO latte_art_designs (name, description, image_path, is_default, is_active, display_order)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            this.db.prepare(query).run(
              design.name,
              design.description,
              design.image_path,
              1, // is_default
              1, // is_active
              design.display_order
            );
            console.log(`✅ Inserted default latte art design: ${design.name}`);
          } catch (error) {
            console.error(`❌ Failed to insert latte art design ${design.name}:`, error.message);
          }
        });

        // Create index for performance
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_latte_art_display_order ON latte_art_designs(display_order)`);
      }

      // Create system settings table
      const systemSettingsTable = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='system_settings'
      `).get();

      if (!systemSettingsTable) {
        console.log('⚙️ Creating system_settings table...');
        this.db.exec(`
          CREATE TABLE system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'boolean', 'number'
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Insert default system settings
        const defaultSettings = [
          { 
            key: 'frontend_enabled', 
            value: 'true', 
            type: 'boolean', 
            description: 'Controls if the kiosk frontend is enabled for customer orders' 
          },
          { 
            key: 'test_mode', 
            value: 'false', 
            type: 'boolean', 
            description: 'When enabled, orders go to typeList100 and all ingredients are forced to full stock for testing' 
          },
          { 
            key: 'out_of_order_message', 
            value: 'Sorry, our coffee machine is temporarily out of order. Please try again later.', 
            type: 'string', 
            description: 'Message displayed when frontend is disabled' 
          },
          {
            key: 'test_mode_message',
            value: 'TEST MODE ACTIVE - Orders will not be sent to the coffee machine',
            type: 'string',
            description: 'Message displayed in admin when test mode is active'
          },
          {
            key: 'payment_enabled',
            value: 'true',
            type: 'boolean',
            description: 'When enabled, payment is required for checkout. When disabled, a daily PIN is required instead.'
          },
          {
            key: 'pin_seed',
            value: 'K2Coffee2025',
            type: 'string',
            description: 'Seed used to generate daily PIN. Change this to regenerate a new PIN.'
          }
        ];

        defaultSettings.forEach(setting => {
          try {
            const query = `
              INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
              VALUES (?, ?, ?, ?)
            `;
            this.db.prepare(query).run(
              setting.key,
              setting.value,
              setting.type,
              setting.description
            );
            console.log(`✅ Inserted default system setting: ${setting.key}`);
          } catch (error) {
            console.error(`❌ Failed to insert system setting ${setting.key}:`, error.message);
          }
        });

        // Create index for performance
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key)`);
      } else {
        // Table exists, ensure new settings are added (for existing databases)
        const paymentSetting = this.db.prepare(`SELECT * FROM system_settings WHERE setting_key = 'payment_enabled'`).get();
        if (!paymentSetting) {
          console.log('💳 Adding payment_enabled setting to existing database...');
          try {
            this.db.prepare(`
              INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
              VALUES (?, ?, ?, ?)
            `).run(
              'payment_enabled',
              'true',
              'boolean',
              'When enabled, payment is required for checkout. When disabled, a daily PIN is required instead.'
            );
            console.log('✅ Added payment_enabled setting');
          } catch (error) {
            console.error('❌ Failed to add payment_enabled setting:', error.message);
          }
        }

        // Add pin_seed setting if it doesn't exist
        const pinSeedSetting = this.db.prepare(`SELECT * FROM system_settings WHERE setting_key = 'pin_seed'`).get();
        if (!pinSeedSetting) {
          console.log('🔑 Adding pin_seed setting to existing database...');
          try {
            this.db.prepare(`
              INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
              VALUES (?, ?, ?, ?)
            `).run(
              'pin_seed',
              'K2Coffee2025',
              'string',
              'Seed used to generate daily PIN. Change this to regenerate a new PIN.'
            );
            console.log('✅ Added pin_seed setting');
          } catch (error) {
            console.error('❌ Failed to add pin_seed setting:', error.message);
          }
        }
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

  runInventoryMigrations() {
    console.log('🔄 Running inventory system migrations...');
    
    try {
      const InventoryMigration = require('./inventory-migration');
      const inventoryMigration = new InventoryMigration(this.db);
      inventoryMigration.run();
      
      // Initialize inventory database methods
      const InventoryDatabase = require('./inventory-db');
      this.inventory = new InventoryDatabase(this.db);
      
      console.log('✅ Inventory system migrations completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Inventory migration failed:', error);
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
        // Note: Mock data is inserted via init.js, not here (to avoid circular dependency)
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

  // OPTIMIZED: Get orders with goods in single query (prevents N+1)
  getAllOrdersWithGoods(deviceId = 1) {
    const stmt = this.db.prepare(`
      SELECT 
        o.id as order_id,
        o.num as order_num_count,
        o.real_price,
        o.status as order_status,
        o.order_num,
        o.created_at as order_created_at,
        o.language as order_language,
        o.created_time,
        og.id as goods_id,
        og.device_goods_id,
        og.type,
        og.goods_id as product_id,
        og.goods_name,
        og.goods_name_en,
        og.goods_name_ot,
        og.goods_img,
        og.goods_option_name,
        og.goods_option_name_en,
        og.goods_option_name_ot,
        og.language as goods_language,
        og.status as goods_status,
        og.price,
        og.re_price,
        og.matter_codes,
        og.num,
        og.total_price,
        og.lh_img_path,
        og.json_code_val,
        og.path,
        og.goods_path
      FROM orders o
      LEFT JOIN order_goods og ON o.id = og.order_id
      WHERE o.device_id = ? AND o.status IN (3, 4)
      ORDER BY o.created_at ASC, og.id ASC
    `);
    
    const rows = stmt.all(deviceId);
    
    // Group rows by order
    const ordersMap = new Map();
    
    rows.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          num: row.order_num_count,
          real_price: row.real_price,
          status: row.order_status,
          order_num: row.order_num,
          created_at: row.order_created_at,
          language: row.order_language,
          created_time: row.created_time,
          goods: []
        });
      }
      
      // Add goods if exists (LEFT JOIN might have null goods)
      if (row.goods_id) {
        ordersMap.get(row.order_id).goods.push({
          id: row.goods_id,
          device_goods_id: row.device_goods_id,
          type: row.type,
          order_id: row.order_id,
          goods_id: row.product_id,
          goods_name: row.goods_name,
          goods_name_en: row.goods_name_en,
          goods_name_ot: row.goods_name_ot,
          goods_img: row.goods_img,
          goods_option_name: row.goods_option_name,
          goods_option_name_en: row.goods_option_name_en,
          goods_option_name_ot: row.goods_option_name_ot,
          language: row.goods_language,
          status: row.goods_status,
          price: row.price,
          re_price: row.re_price,
          matter_codes: row.matter_codes,
          num: row.num,
          total_price: row.total_price,
          lh_img_path: row.lh_img_path,
          json_code_val: row.json_code_val,
          path: row.path,
          goods_path: row.goods_path
        });
      }
    });
    
    return Array.from(ordersMap.values());
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

  // Removed duplicate updateProduct method - using the enhanced version below

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
        category: 'category',
        // Variant system fields
        icedClassCode: 'iced_class_code',
        doubleShotClassCode: 'double_shot_class_code',
        icedAndDoubleClassCode: 'iced_and_double_class_code',
        // Latte art printing option
        hasLatteArt: 'has_latte_art',
        // Ice cream topping options
        hasToppingOptions: 'has_topping_options',
        defaultToppingType: 'default_topping_type',
        // Ice cream syrup variant classCodes
        syrup1ClassCode: 'syrup1_class_code',
        syrup2ClassCode: 'syrup2_class_code',
        syrup3ClassCode: 'syrup3_class_code'
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
      const usedDbFields = new Set(); // Track which database fields we've already processed
      
      Object.keys(updates).forEach(key => {
        // Skip id, createdAt, updatedAt fields (id handled separately above)
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
          return;
        }
        
        // Skip computed availability fields - these are not stored in database
        if (key === 'available' || key === 'missingIngredients' || key === 'availabilityReason') {
          console.log(`⚠️ Skipping computed field: ${key}`);
          return;
        }
        
        const dbField = fieldMapping[key] || key;
        
        // Skip if we've already processed this database field to avoid duplicates
        if (usedDbFields.has(dbField)) {
          console.log(`⚠️ Skipping duplicate field: ${key} -> ${dbField}`);
          return;
        }
        
        usedDbFields.add(dbField);
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
      
      // Log image updates specifically
      if (updates.goodsPath) {
        console.log('🖼️ Image path update detected:', updates.goodsPath);
      }
      
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

  // Latte Art Designs Management
  getAllLatteArtDesigns() {
    try {
      const query = `
        SELECT * FROM latte_art_designs 
        WHERE is_active = 1 
        ORDER BY display_order ASC, name ASC
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching latte art designs:', error);
      throw error;
    }
  }

  getLatteArtDesignById(id) {
    try {
      const query = `SELECT * FROM latte_art_designs WHERE id = ?`;
      return this.db.prepare(query).get(id);
    } catch (error) {
      console.error('Error fetching latte art design:', error);
      throw error;
    }
  }

  insertLatteArtDesign(design) {
    try {
      const query = `
        INSERT INTO latte_art_designs (name, description, image_path, is_default, is_active, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      return this.db.prepare(query).run(
        design.name,
        design.description || '',
        design.image_path,
        design.is_default || 0,
        design.is_active !== undefined ? design.is_active : 1,
        design.display_order || 0
      );
    } catch (error) {
      console.error('Error inserting latte art design:', error);
      throw error;
    }
  }

  updateLatteArtDesign(id, updates) {
    try {
      const allowedFields = ['name', 'description', 'image_path', 'is_default', 'is_active', 'display_order'];
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
      
      values.push(id);
      
      const query = `
        UPDATE latte_art_designs 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = this.db.prepare(query).run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating latte art design:', error);
      throw error;
    }
  }

  deleteLatteArtDesign(id) {
    try {
      // Soft delete - mark as inactive
      const query = `
        UPDATE latte_art_designs 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = this.db.prepare(query).run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting latte art design:', error);
      throw error;
    }
  }

  // System Settings Management
  getAllSystemSettings() {
    try {
      const query = `SELECT * FROM system_settings ORDER BY setting_key`;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  getSystemSetting(key) {
    try {
      const query = `SELECT * FROM system_settings WHERE setting_key = ?`;
      const setting = this.db.prepare(query).get(key);
      
      if (!setting) {
        return null;
      }

      // Convert value based on type
      if (setting.setting_type === 'boolean') {
        return {
          ...setting,
          setting_value: setting.setting_value === 'true'
        };
      } else if (setting.setting_type === 'number') {
        return {
          ...setting,
          setting_value: parseFloat(setting.setting_value)
        };
      }
      
      return setting;
    } catch (error) {
      console.error('Error fetching system setting:', error);
      throw error;
    }
  }

  updateSystemSetting(key, value) {
    try {
      // Convert value to string for storage
      const stringValue = typeof value === 'boolean' ? value.toString() : value.toString();
      
      const query = `
        UPDATE system_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `;
      
      const result = this.db.prepare(query).run(stringValue, key);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  }

  // Convenience methods for specific settings
  isFrontendEnabled() {
    try {
      const setting = this.getSystemSetting('frontend_enabled');
      return setting ? setting.setting_value : true; // Default to enabled
    } catch (error) {
      console.error('Error checking frontend status:', error);
      return true; // Default to enabled if error
    }
  }

  isTestMode() {
    try {
      const setting = this.getSystemSetting('test_mode');
      return setting ? setting.setting_value : false; // Default to disabled
    } catch (error) {
      console.error('Error checking test mode status:', error);
      return false; // Default to disabled if error
    }
  }

  getOutOfOrderMessage() {
    try {
      const setting = this.getSystemSetting('out_of_order_message');
      return setting ? setting.setting_value : 'Sorry, our coffee machine is temporarily out of order. Please try again later.';
    } catch (error) {
      console.error('Error fetching out of order message:', error);
      return 'Sorry, our coffee machine is temporarily out of order. Please try again later.';
    }
  }

  isPaymentEnabled() {
    try {
      const setting = this.getSystemSetting('payment_enabled');
      return setting ? setting.setting_value : true; // Default to enabled
    } catch (error) {
      console.error('Error checking payment status:', error);
      return true; // Default to enabled if error
    }
  }

  // Get the PIN seed from database
  getPinSeed() {
    try {
      const setting = this.getSystemSetting('pin_seed');
      return setting ? setting.setting_value : 'K2Coffee2025';
    } catch (error) {
      console.error('Error getting PIN seed:', error);
      return 'K2Coffee2025';
    }
  }

  // Generate a daily PIN based on the current date and seed
  // PIN changes every day at midnight or when seed is regenerated
  getDailyPin() {
    try {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get seed from database (can be regenerated)
      const seed = this.getPinSeed();
      const combined = dateString + seed;

      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      // Get absolute value and extract 4 digits
      const absHash = Math.abs(hash);
      const pin = String(absHash).slice(-4).padStart(4, '0');

      return pin;
    } catch (error) {
      console.error('Error generating daily PIN:', error);
      return '0000'; // Fallback PIN
    }
  }

  // Regenerate PIN by creating a new random seed
  regeneratePin() {
    try {
      // Generate a new random seed
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const newSeed = `K2Pin${timestamp}${random}`;

      // Update the seed in database
      const success = this.updateSystemSetting('pin_seed', newSeed);

      if (success) {
        const newPin = this.getDailyPin();
        console.log(`🔑 PIN regenerated successfully. New PIN: ${newPin}`);
        return { success: true, newPin };
      } else {
        return { success: false, error: 'Failed to update PIN seed' };
      }
    } catch (error) {
      console.error('Error regenerating PIN:', error);
      return { success: false, error: error.message };
    }
  }

  verifyDailyPin(inputPin) {
    const correctPin = this.getDailyPin();
    return inputPin === correctPin;
  }

  // Option Names Management
  getAllOptionNames() {
    try {
      const query = `SELECT * FROM option_names WHERE is_active = 1 ORDER BY option_key`;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('Error fetching option names:', error);
      throw error;
    }
  }

  getOptionName(key) {
    try {
      const query = `SELECT * FROM option_names WHERE option_key = ? AND is_active = 1`;
      return this.db.prepare(query).get(key);
    } catch (error) {
      console.error('Error fetching option name:', error);
      throw error;
    }
  }

  createOptionName(optionData) {
    try {
      const query = `
        INSERT INTO option_names (option_key, name_en, name_ar, description_en, description_ar, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = this.db.prepare(query).run(
        optionData.option_key,
        optionData.name_en,
        optionData.name_ar,
        optionData.description_en || '',
        optionData.description_ar || '',
        optionData.is_active !== undefined ? optionData.is_active : 1
      );
      
      return this.getOptionName(optionData.option_key);
    } catch (error) {
      console.error('Error creating option name:', error);
      throw error;
    }
  }

  updateOptionName(key, updateData) {
    try {
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      
      if (updateData.name_en !== undefined) {
        updateFields.push('name_en = ?');
        values.push(updateData.name_en);
      }
      if (updateData.name_ar !== undefined) {
        updateFields.push('name_ar = ?');
        values.push(updateData.name_ar);
      }
      if (updateData.description_en !== undefined) {
        updateFields.push('description_en = ?');
        values.push(updateData.description_en);
      }
      if (updateData.description_ar !== undefined) {
        updateFields.push('description_ar = ?');
        values.push(updateData.description_ar);
      }
      if (updateData.is_active !== undefined) {
        updateFields.push('is_active = ?');
        values.push(updateData.is_active ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        return this.getOptionName(key);
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(key);
      
      const query = `UPDATE option_names SET ${updateFields.join(', ')} WHERE option_key = ?`;
      const result = this.db.prepare(query).run(...values);
      
      if (result.changes === 0) {
        return null;
      }
      
      return this.getOptionName(key);
    } catch (error) {
      console.error('Error updating option name:', error);
      throw error;
    }
  }

  deleteOptionName(key) {
    try {
      const query = `UPDATE option_names SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE option_key = ?`;
      const result = this.db.prepare(query).run(key);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting option name:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
