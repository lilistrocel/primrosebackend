const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coffee_machine.db');
const db = new Database(dbPath);

console.log('🔧 Enabling ice and shot options for all coffee products...');

try {
  // Enable ice and shot options for all coffee products (type = 2)
  const updateQuery = `
    UPDATE products 
    SET has_ice_options = 1,
        has_shot_options = 1,
        default_ice = 0,
        default_shots = 1
    WHERE type = 2
  `;
  
  const result = db.prepare(updateQuery).run();
  console.log(`✅ Updated ${result.changes} coffee products with ice and shot options`);
  
  // Show current status
  const products = db.prepare(`
    SELECT goods_name_en, has_ice_options, has_shot_options, 
           iced_class_code, double_shot_class_code, iced_and_double_class_code
    FROM products 
    WHERE type = 2
    ORDER BY id
  `).all();
  
  console.log('\n📋 Current coffee products configuration:');
  products.forEach(product => {
    console.log(`\n🔸 ${product.goods_name_en}:`);
    console.log(`   Ice Options: ${product.has_ice_options ? 'ENABLED' : 'disabled'}`);
    console.log(`   Shot Options: ${product.has_shot_options ? 'ENABLED' : 'disabled'}`);
    console.log(`   Iced ClassCode: ${product.iced_class_code || 'NOT SET'}`);
    console.log(`   Double Shot ClassCode: ${product.double_shot_class_code || 'NOT SET'}`);
    console.log(`   Iced + Double ClassCode: ${product.iced_and_double_class_code || 'NOT SET'}`);
  });
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Go to Item Management and edit each product');
  console.log('2. Set the variant classCodes in the "Variant ClassCodes" section');
  console.log('3. Test in kiosk - customization modal should now appear');
  console.log('4. When you select ice/shots, the appropriate classCode will be used');
  
} catch (error) {
  console.error('❌ Error enabling options:', error);
} finally {
  db.close();
}

console.log('\n✅ Configuration complete!');
