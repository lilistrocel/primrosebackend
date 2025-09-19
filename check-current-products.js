const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coffee_machine.db');
const db = new Database(dbPath);

console.log('📋 Current Products in Database:\n');

const products = db.prepare(`
  SELECT id, goods_name_en, goods_name, json_code_val, type
  FROM products 
  ORDER BY type, id
`).all();

products.forEach(product => {
  try {
    const jsonCodeVal = JSON.parse(product.json_code_val);
    const classCode = jsonCodeVal.find(item => item.classCode)?.classCode;
    const typeMap = {1: 'Tea', 2: 'Coffee', 3: 'Ice Cream', 4: 'Other'};
    
    console.log(`🔸 ID ${product.id}: ${product.goods_name_en} (${product.goods_name})`);
    console.log(`   Type: ${typeMap[product.type] || product.type}`);
    console.log(`   ClassCode: ${classCode}`);
    console.log(`   Full JSON: ${product.json_code_val}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Error parsing JSON for ${product.goods_name_en}: ${error.message}`);
  }
});

db.close();
