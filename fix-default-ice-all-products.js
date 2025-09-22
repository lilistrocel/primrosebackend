const Database = require('better-sqlite3');

const dbPath = './coffee_machine.db';
console.log('🧊 Fixing default ice settings for all products...');

try {
  const db = new Database(dbPath);
  
  // First, show current state
  console.log('\n📋 BEFORE - Current ice settings:');
  const beforeProducts = db.prepare(`
    SELECT id, goods_name_en, has_ice_options, default_ice, json_code_val 
    FROM products 
    WHERE type = 2 
    ORDER BY id
  `).all();
  
  beforeProducts.forEach(product => {
    const jsonCodeVal = JSON.parse(product.json_code_val);
    const cupCode = jsonCodeVal.find(item => item.CupCode)?.CupCode || 'N/A';
    console.log(`   ${product.id}: ${product.goods_name_en}`);
    console.log(`      Ice Options: ${product.has_ice_options ? 'ENABLED' : 'disabled'}`);
    console.log(`      Default Ice: ${product.default_ice ? 'WITH ICE' : 'NO ICE'}`);
    console.log(`      Current CupCode: ${cupCode}`);
  });
  
  // Update all coffee products (type = 2) to have default_ice = 0
  console.log('\n🔧 Updating all coffee products...');
  const updateAllQuery = `
    UPDATE products 
    SET default_ice = 0 
    WHERE type = 2
  `;
  
  const result = db.prepare(updateAllQuery).run();
  console.log(`✅ Updated ${result.changes} coffee products: default_ice = 0 (no ice)`);
  
  // Show after state
  console.log('\n📋 AFTER - Updated ice settings:');
  const afterProducts = db.prepare(`
    SELECT id, goods_name_en, has_ice_options, default_ice, json_code_val 
    FROM products 
    WHERE type = 2 
    ORDER BY id
  `).all();
  
  afterProducts.forEach(product => {
    const jsonCodeVal = JSON.parse(product.json_code_val);
    const cupCode = jsonCodeVal.find(item => item.CupCode)?.CupCode || 'N/A';
    console.log(`   ${product.id}: ${product.goods_name_en}`);
    console.log(`      Ice Options: ${product.has_ice_options ? 'ENABLED' : 'disabled'}`);
    console.log(`      Default Ice: ${product.default_ice ? 'WITH ICE' : 'NO ICE'} ✅`);
    console.log(`      Current CupCode: ${cupCode}`);
  });
  
  console.log('\n💡 RESULT:');
  console.log('✅ All coffee products now default to NO ICE');
  console.log('✅ When customers customize drinks:');
  console.log('   - NO ice selected → CupCode = "2" (regular cup)');
  console.log('   - Ice selected → CupCode = "3" (iced cup)');
  console.log('✅ This affects both existing and new customized orders');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error updating products:', error);
}

console.log('\n🏁 Default ice settings update complete!');
