const db = require('./src/database/db');

console.log('🔍 Checking Order Goods Table Structure...\n');

try {
  // Check order_goods table schema
  console.log('📋 order_goods table schema:');
  const schema = db.db.prepare('PRAGMA table_info(order_goods)').all();
  schema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  console.log('\n📦 Sample order_goods data:');
  const sampleData = db.db.prepare('SELECT * FROM order_goods LIMIT 3').all();
  console.log(`Found ${sampleData.length} records:`);
  sampleData.forEach((record, index) => {
    console.log(`  ${index + 1}.`, record);
  });
  
  console.log('\n📋 Sample products data:');
  const products = db.db.prepare('SELECT id, goods_id, goods_name_en FROM products LIMIT 3').all();
  console.log(`Found ${products.length} products:`);
  products.forEach((product, index) => {
    console.log(`  ${index + 1}. ID: ${product.id}, goods_id: ${product.goods_id}, name: ${product.goods_name_en}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error);
}
