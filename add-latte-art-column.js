// Add has_latte_art column to products table on remote server
const db = require('./src/database/db');

console.log('🔧 Adding has_latte_art column to products table...');

try {
  // Check if column already exists
  const columns = db.db.prepare('PRAGMA table_info(products)').all();
  const hasLatteArtColumn = columns.find(col => col.name === 'has_latte_art');
  
  if (hasLatteArtColumn) {
    console.log('✅ has_latte_art column already exists!');
    
    // Show current products with latte art
    const products = db.db.prepare('SELECT goods_name_en, has_latte_art FROM products').all();
    console.log('\n📋 Current products:');
    products.forEach(p => {
      const latteArt = p.has_latte_art ? '🎨' : '❌';
      console.log(`  ${latteArt} ${p.goods_name_en}`);
    });
    
  } else {
    console.log('❌ has_latte_art column missing. Adding it now...');
    
    // Add the column
    db.db.exec('ALTER TABLE products ADD COLUMN has_latte_art BOOLEAN DEFAULT 0');
    
    console.log('✅ has_latte_art column added successfully!');
    
    // Verify it was added
    const newColumns = db.db.prepare('PRAGMA table_info(products)').all();
    const newLatteArtColumn = newColumns.find(col => col.name === 'has_latte_art');
    
    if (newLatteArtColumn) {
      console.log('✅ Column verified - has_latte_art is now available!');
      console.log('\n🎨 You can now enable latte art for products in Item Management!');
    } else {
      console.log('❌ Failed to add column. Please check database permissions.');
    }
  }
  
} catch (error) {
  console.error('❌ Error updating database:', error);
  console.log('\n🔧 Alternative solution:');
  console.log('1. Restart the backend: pm2 restart coffee-backend');
  console.log('2. The migration should run automatically');
}

console.log('\n✨ Script completed!');
