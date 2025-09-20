// Test updating latte art for a specific product
const db = require('./src/database/db');

console.log('🧪 Testing latte art update for "Latte Printing" product...');

try {
  // Find the "Latte Printing" product
  const products = db.db.prepare('SELECT * FROM products WHERE goods_name_en LIKE ?').all('%Latte Printing%');
  
  if (products.length === 0) {
    console.log('❌ No "Latte Printing" product found');
    return;
  }
  
  const product = products[0];
  console.log(`\n📋 Found product: ${product.goods_name_en} (ID: ${product.id})`);
  console.log(`🎨 Current latte art setting: ${product.has_latte_art ? 'ENABLED' : 'DISABLED'}`);
  
  // Test update with latte art enabled
  console.log('\n🔄 Testing update with hasLatteArt: true...');
  
  const updateData = {
    hasLatteArt: true
  };
  
  console.log('📤 Update data:', updateData);
  
  // Call the updateProduct method
  const result = db.updateProduct(product.id, updateData);
  
  console.log('📥 Update result:', result);
  
  // Check if the update worked
  const updatedProduct = db.db.prepare('SELECT goods_name_en, has_latte_art FROM products WHERE id = ?').get(product.id);
  
  console.log('\n✅ After update:');
  console.log(`🎨 Latte art setting: ${updatedProduct.has_latte_art ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  
  if (updatedProduct.has_latte_art) {
    console.log('\n🎉 SUCCESS! Latte art is now enabled for this product!');
  } else {
    console.log('\n❌ FAILED! Latte art is still disabled. Check the update logic.');
  }
  
} catch (error) {
  console.error('❌ Error during test:', error);
}

console.log('\n✨ Test completed!');
