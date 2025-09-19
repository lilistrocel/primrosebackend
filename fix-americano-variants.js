const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coffee_machine.db');
const db = new Database(dbPath);

console.log('🔧 Setting up variant classCodes for Americano...');

try {
  // First, let's see what we have
  const americano = db.prepare(`
    SELECT id, goods_name_en, json_code_val, has_ice_options, iced_class_code
    FROM products 
    WHERE goods_name_en LIKE '%Americano%' OR goods_name LIKE '%美式%'
    LIMIT 1
  `).get();
  
  if (!americano) {
    console.log('❌ No Americano product found');
    process.exit(1);
  }
  
  console.log(`📋 Found Americano: ID ${americano.id} - ${americano.goods_name_en}`);
  console.log(`   Current JSON: ${americano.json_code_val}`);
  console.log(`   Has Ice Options: ${americano.has_ice_options}`);
  console.log(`   Current Iced ClassCode: ${americano.iced_class_code || 'NOT SET'}`);
  
  // Parse current classCode
  const currentJson = JSON.parse(americano.json_code_val);
  const currentClassCode = currentJson.find(item => item.classCode)?.classCode;
  console.log(`   Current ClassCode: ${currentClassCode}`);
  
  // Set variant classCodes for Americano
  const updateQuery = `
    UPDATE products 
    SET iced_class_code = '5227',
        double_shot_class_code = '5005', 
        iced_and_double_class_code = '5228'
    WHERE id = ?
  `;
  
  const result = db.prepare(updateQuery).run(americano.id);
  console.log(`\n✅ Updated Americano with variant classCodes:`);
  console.log(`   Regular Americano: ${currentClassCode}`);
  console.log(`   Iced Americano: 5227`);
  console.log(`   Double Shot Americano: 5005`);
  console.log(`   Iced + Double Shot Americano: 5228`);
  
  // Verify the update
  const updated = db.prepare(`
    SELECT iced_class_code, double_shot_class_code, iced_and_double_class_code
    FROM products 
    WHERE id = ?
  `).get(americano.id);
  
  console.log(`\n🔍 Verification:`);
  console.log(`   Iced ClassCode: ${updated.iced_class_code}`);
  console.log(`   Double Shot ClassCode: ${updated.double_shot_class_code}`);
  console.log(`   Iced + Double ClassCode: ${updated.iced_and_double_class_code}`);
  
} catch (error) {
  console.error('❌ Error setting variant classCodes:', error);
} finally {
  db.close();
}

console.log('\n🎯 TEST NOW:');
console.log('1. Go to kiosk');
console.log('2. Add Americano with ICE selected');
console.log('3. Check Order Monitor - should show Product: 5227');
console.log('4. Add regular Americano (no ice)');
console.log('5. Check Order Monitor - should show Product: 5002');
