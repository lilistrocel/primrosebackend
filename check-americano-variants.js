const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coffee_machine.db');
const db = new Database(dbPath);

console.log('🔍 Checking Americano variant configuration...');

// Check current Americano products
const americanoProducts = db.prepare(`
  SELECT id, goods_name_en, json_code_val, has_ice_options, iced_class_code, 
         has_shot_options, double_shot_class_code, iced_and_double_class_code
  FROM products 
  WHERE goods_name_en LIKE '%Americano%' OR goods_name LIKE '%美式%'
`).all();

console.log('📋 Current Americano products:');
americanoProducts.forEach(product => {
  console.log(`\n🔸 Product ID ${product.id}: ${product.goods_name_en}`);
  console.log(`   JSON Code Val: ${product.json_code_val}`);
  console.log(`   Has Ice Options: ${product.has_ice_options}`);
  console.log(`   Iced Class Code: ${product.iced_class_code || 'NOT SET'}`);
  console.log(`   Has Shot Options: ${product.has_shot_options}`);
  console.log(`   Double Shot Class Code: ${product.double_shot_class_code || 'NOT SET'}`);
  console.log(`   Iced + Double Class Code: ${product.iced_and_double_class_code || 'NOT SET'}`);
});

// Fix the Americano configuration
if (americanoProducts.length > 0) {
  const americano = americanoProducts[0];
  console.log('\n🔧 Updating Americano configuration...');
  
  try {
    // Parse the current classCode
    const jsonCodeVal = JSON.parse(americano.json_code_val);
    const currentClassCode = jsonCodeVal.find(item => item.classCode)?.classCode;
    console.log(`   Current classCode: ${currentClassCode}`);
    
    // Update Americano with variant configurations
    const updateQuery = `
      UPDATE products 
      SET has_ice_options = 1,
          iced_class_code = '5227',
          has_shot_options = 1, 
          double_shot_class_code = '5005',
          iced_and_double_class_code = '5228'
      WHERE id = ?
    `;
    
    const result = db.prepare(updateQuery).run(americano.id);
    console.log(`✅ Updated Americano (ID: ${americano.id}) with variant classCodes`);
    console.log('   - Regular Americano: 5002 (current)');
    console.log('   - Iced Americano: 5227');
    console.log('   - Double Shot Americano: 5005'); 
    console.log('   - Iced + Double Shot Americano: 5228');
    
  } catch (error) {
    console.error('❌ Error updating Americano:', error);
  }
} else {
  console.log('❌ No Americano products found in database');
}

db.close();
console.log('\n✅ Check complete!');
