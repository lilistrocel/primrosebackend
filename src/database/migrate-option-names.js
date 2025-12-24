const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '..', '..', 'coffee_machine.db');
const db = new Database(dbPath);

console.log('🔄 Starting option names migration...');

try {
  // Create option_names table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS option_names (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_key VARCHAR(50) NOT NULL UNIQUE,
      name_en VARCHAR(100) NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      description_en VARCHAR(200),
      description_ar VARCHAR(200),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ Created option_names table');

  // Create indexes
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_option_names_key ON option_names(option_key);
    CREATE INDEX IF NOT EXISTS idx_option_names_active ON option_names(is_active);
  `;
  
  db.exec(createIndexesSQL);
  console.log('✅ Created indexes for option_names table');

  // Check if table already has data
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM option_names').get();
  
  if (existingCount.count === 0) {
    // Insert default option names
    const defaultOptionNames = [
      // Bean Types
      ['beanType1', 'Bean Type 1', 'نوع الحبوب 1', 'House Blend', 'مزيج البيت'],
      ['beanType2', 'Bean Type 2', 'نوع الحبوب 2', 'Premium Roast', 'تحميص مميز'],
      
      // Milk Types
      ['milkType1', 'Regular Milk', 'حليب عادي', 'Whole milk', 'حليب كامل'],
      ['milkType2', 'Oat Milk', 'حليب الشوفان', 'Plant-based', 'نباتي'],
      
      // Ice Preferences
      ['withIce', 'With Ice', 'مع ثلج', 'Regular ice', 'ثلج عادي'],
      ['noIce', 'No Ice', 'بدون ثلج', 'Hot beverage', 'مشروب ساخن'],
      
      // Coffee Shots
      ['singleShot', 'Single Shot', 'جرعة واحدة', 'Regular strength', 'قوة عادية'],
      ['doubleShot', 'Double Shot', 'جرعتان', '+$0.50', '+$0.50'],

      // Ice Cream Toppings (fruitpiecesType)
      ['fruitpiecesType_0', 'No Topping', 'بدون إضافات', 'Plain ice cream', 'آيس كريم سادة'],
      ['fruitpiecesType_1', 'Oreo Crumbs', 'فتات أوريو', 'Crushed Oreo cookies', 'قطع بسكويت أوريو'],
      ['fruitpiecesType_2', 'Crushed Nuts', 'مكسرات مطحونة', 'Assorted crushed nuts', 'مكسرات متنوعة مطحونة']
    ];

    const insertSQL = `
      INSERT INTO option_names (option_key, name_en, name_ar, description_en, description_ar)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const insertStmt = db.prepare(insertSQL);
    
    for (const [optionKey, nameEn, nameAr, descEn, descAr] of defaultOptionNames) {
      insertStmt.run(optionKey, nameEn, nameAr, descEn, descAr);
    }
    
    console.log('✅ Inserted default option names');
  } else {
    console.log('ℹ️  Option names table already has data, checking for ice cream topping options...');

    // Add ice cream topping and syrup options if they don't exist (for existing databases)
    const iceCreamOptions = [
      // Section headers
      ['toppingType', 'Topping', 'الإضافات', 'Choose your topping', 'اختر الإضافة'],
      ['syrupType', 'Syrup', 'الشراب', 'Choose your syrup', 'اختر الشراب'],

      // Topping options (fruitpiecesType)
      ['fruitpiecesType_0', 'No Topping', 'بدون إضافات', 'Plain ice cream', 'آيس كريم سادة'],
      ['fruitpiecesType_1', 'Oreo Crumbs', 'فتات أوريو', 'Crushed Oreo cookies', 'قطع بسكويت أوريو'],
      ['fruitpiecesType_2', 'Crushed Nuts', 'مكسرات مطحونة', 'Assorted crushed nuts', 'مكسرات متنوعة مطحونة'],

      // Syrup options
      ['syrupType_0', 'No Syrup', 'بدون شراب', 'Plain', 'سادة'],
      ['syrupType_1', 'Chocolate', 'شوكولاتة', 'Rich chocolate syrup', 'شراب شوكولاتة غني'],
      ['syrupType_2', 'Strawberry', 'فراولة', 'Sweet strawberry syrup', 'شراب فراولة حلو'],
      ['syrupType_3', 'Caramel', 'كراميل', 'Buttery caramel syrup', 'شراب كراميل زبدي']
    ];

    const insertSQL = `
      INSERT OR IGNORE INTO option_names (option_key, name_en, name_ar, description_en, description_ar)
      VALUES (?, ?, ?, ?, ?)
    `;
    const insertStmt = db.prepare(insertSQL);

    for (const [optionKey, nameEn, nameAr, descEn, descAr] of iceCreamOptions) {
      const result = insertStmt.run(optionKey, nameEn, nameAr, descEn, descAr);
      if (result.changes > 0) {
        console.log(`🍦 Added ice cream option: ${optionKey}`);
      }
    }
  }

  console.log('🎉 Option names migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
