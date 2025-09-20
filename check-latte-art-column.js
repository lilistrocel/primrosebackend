// Check if has_latte_art column exists in the database
const db = require('./src/database/db');

try {
  // Get table info
  const columns = db.db.prepare('PRAGMA table_info(products)').all();
  
  console.log('📋 Products table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
  });
  
  // Check specifically for latte art column
  const hasLatteArtColumn = columns.find(col => col.name === 'has_latte_art');
  
  if (hasLatteArtColumn) {
    console.log('\n✅ has_latte_art column EXISTS');
    
    // Check if any products have latte art enabled
    const latteArtProducts = db.db.prepare('SELECT goodsNameEn, has_latte_art FROM products WHERE has_latte_art = 1').all();
    console.log(`\n🎨 Products with latte art enabled: ${latteArtProducts.length}`);
    latteArtProducts.forEach(p => console.log(`  - ${p.goodsNameEn}`));
    
  } else {
    console.log('\n❌ has_latte_art column MISSING');
    console.log('\n🔧 To fix this, restart the backend or run:');
    console.log('   ALTER TABLE products ADD COLUMN has_latte_art BOOLEAN DEFAULT 0;');
  }
  
} catch (error) {
  console.error('❌ Error checking database:', error);
}
