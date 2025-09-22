const Database = require('better-sqlite3');

const dbPath = './coffee_machine.db';
console.log('🔍 Checking latte art table status...');

try {
  const db = new Database(dbPath);
  
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='latte_art_designs'
  `).get();
  
  if (tableExists) {
    console.log('✅ latte_art_designs table exists');
    
    // Check table structure
    const tableInfo = db.prepare(`PRAGMA table_info(latte_art_designs)`).all();
    console.log('📋 Table structure:');
    tableInfo.forEach(col => {
      console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
    // Check current designs
    const designs = db.prepare(`SELECT id, name, image_path FROM latte_art_designs`).all();
    console.log(`\n🎨 Current designs: ${designs.length}`);
    designs.forEach(design => {
      console.log(`   ${design.id}: ${design.name} → ${design.image_path}`);
    });
    
  } else {
    console.log('❌ latte_art_designs table does NOT exist');
    console.log('💡 Creating table...');
    
    db.exec(`
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
    
    // Insert default designs
    const defaultDesigns = [
      { name: 'Heart', description: 'Classic heart design', image_path: '/public/uploads/latte-art/heart.png', display_order: 1 },
      { name: 'Leaf', description: 'Beautiful leaf pattern', image_path: '/public/uploads/latte-art/leaf.png', display_order: 2 },
      { name: 'Tulip', description: 'Elegant tulip design', image_path: '/public/uploads/latte-art/tulip.png', display_order: 3 },
      { name: 'Rose', description: 'Intricate rose pattern', image_path: '/public/uploads/latte-art/rose.png', display_order: 4 }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO latte_art_designs (name, description, image_path, display_order)
      VALUES (?, ?, ?, ?)
    `);
    
    defaultDesigns.forEach(design => {
      insertStmt.run(design.name, design.description, design.image_path, design.display_order);
    });
    
    console.log('✅ Table created and default designs added');
  }
  
  // Check upload directory
  const fs = require('fs');
  const path = require('path');
  const uploadDir = path.join(__dirname, 'public/uploads/latte-art');
  
  if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creating upload directory:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created');
  } else {
    console.log('✅ Upload directory exists:', uploadDir);
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error checking database:', error);
}

console.log('\n🏁 Database check complete!');
