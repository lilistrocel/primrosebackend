-- Coffee Machine Backend Database Schema
-- Designed for 100% compatibility with existing API responses

-- Orders table - main order information
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL DEFAULT 1,
    order_num VARCHAR(50) UNIQUE NOT NULL,
    uid INTEGER,
    num INTEGER DEFAULT 1,
    real_price DECIMAL(10,2) NOT NULL,
    pay_money DECIMAL(10,2),
    status INTEGER NOT NULL DEFAULT 2, -- 1:待支付, 2:已支付, 3:待制作, 4:制作中, 5:已完成
    created_at INTEGER NOT NULL, -- Unix timestamp
    created_time DATETIME NOT NULL,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    pay_time DATETIME,
    queue_time DATETIME,
    make_time DATETIME,
    success_time DATETIME,
    payment_intent VARCHAR(100),
    name VARCHAR(100),
    address TEXT,
    guomao_code VARCHAR(50),
    guomao_channel VARCHAR(50),
    guomao_used_user VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en' -- en, zh, ar, etc.
);

-- Order goods - individual items within orders
CREATE TABLE IF NOT EXISTS order_goods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    device_goods_id INTEGER NOT NULL,
    goods_id INTEGER NOT NULL,
    goods_name VARCHAR(100) NOT NULL,
    goods_name_en VARCHAR(100),
    goods_name_ot VARCHAR(100), -- Other language (Arabic, etc.)
    goods_img INTEGER,
    goods_option_name VARCHAR(200),
    goods_option_name_en VARCHAR(200),
    goods_option_name_ot VARCHAR(200),
    type INTEGER NOT NULL, -- 1:奶茶, 2:咖啡, 3:冰淇淋, 4:其他
    status INTEGER NOT NULL DEFAULT 2,
    price DECIMAL(10,2) NOT NULL,
    re_price DECIMAL(10,2) NOT NULL,
    matter_codes TEXT, -- Comma-separated ingredient codes
    num INTEGER DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    lh_img_path TEXT DEFAULT '', -- Print image path
    json_code_val TEXT NOT NULL, -- CRITICAL: Production instructions JSON
    path VARCHAR(255),
    goods_path VARCHAR(500), -- Full URL to product image
    language VARCHAR(10) DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Products catalog - master list of available products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goods_id INTEGER UNIQUE NOT NULL, -- Product ID used in orders
    device_goods_id INTEGER NOT NULL, -- Device-specific product ID
    goods_name VARCHAR(100) NOT NULL, -- Chinese name
    goods_name_en VARCHAR(100) NOT NULL, -- English name
    goods_name_ot VARCHAR(100), -- Other language (Arabic, etc.)
    type INTEGER NOT NULL, -- 1:奶茶, 2:咖啡, 3:冰淇淋, 4:其他
    price DECIMAL(10,2) NOT NULL,
    re_price DECIMAL(10,2) NOT NULL, -- Original price
    matter_codes TEXT, -- Comma-separated ingredient codes
    json_code_val TEXT NOT NULL, -- CRITICAL: Production instructions JSON
    goods_img INTEGER,
    path VARCHAR(255),
    goods_path VARCHAR(500), -- Full URL to product image
    
    -- Customization options configuration
    has_bean_options BOOLEAN DEFAULT 0, -- Enable bean type selection
    has_milk_options BOOLEAN DEFAULT 0, -- Enable milk type selection
    has_ice_options BOOLEAN DEFAULT 0, -- Enable ice/no ice selection
    has_shot_options BOOLEAN DEFAULT 0, -- Enable single/double shot
    default_bean_code INTEGER DEFAULT 1, -- Default bean type (1 or 2)
    default_milk_code INTEGER DEFAULT 1, -- Default milk type (1 or 2)
    default_ice BOOLEAN DEFAULT 1, -- Default ice setting (1=ice, 0=no ice)
    default_shots INTEGER DEFAULT 1, -- Default shot count (1 or 2)
    
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deleted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Device status tracking
CREATE TABLE IF NOT EXISTS device_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL DEFAULT 1,
    matter_status_json TEXT NOT NULL, -- JSON string of ingredient levels
    device_status_json TEXT NOT NULL, -- JSON string of device health
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_num ON orders(order_num);
CREATE INDEX IF NOT EXISTS idx_order_goods_order_id ON order_goods(order_id);
CREATE INDEX IF NOT EXISTS idx_order_goods_type ON order_goods(type);
CREATE INDEX IF NOT EXISTS idx_order_goods_status ON order_goods(status);
CREATE INDEX IF NOT EXISTS idx_products_goods_id ON products(goods_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_device_status_device_id ON device_status(device_id);
