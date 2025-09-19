const db = require('./db');

/**
 * Database migration utility
 * Safely adds new columns and tables to existing database
 */
class DatabaseMigrator {
  static runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
      // Check if categories table exists
      const tablesResult = db.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='categories'
      `).get();

      if (!tablesResult) {
        console.log('📋 Creating categories table...');
        db.db.exec(`
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
            db.insertCategory(category);
            console.log(`✅ Inserted default category: ${category.name}`);
          } catch (error) {
            console.error(`❌ Failed to insert category ${category.name}:`, error.message);
          }
        });
      }

      // Check if products table has category column
      const columnsResult = db.db.prepare(`PRAGMA table_info(products)`).all();
      const hasCategory = columnsResult.some(col => col.name === 'category');
      const hasDisplayOrder = columnsResult.some(col => col.name === 'display_order');

      if (!hasCategory) {
        console.log('📋 Adding category column to products table...');
        db.db.exec(`ALTER TABLE products ADD COLUMN category VARCHAR(50) DEFAULT 'Classics'`);
      }

      if (!hasDisplayOrder) {
        console.log('📋 Adding display_order column to products table...');
        db.db.exec(`ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0`);
      }

      // Create indexes if they don't exist
      console.log('📋 Creating indexes...');
      try {
        db.db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order)`);
        db.db.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
        db.db.exec(`CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order)`);
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
}

module.exports = DatabaseMigrator;
