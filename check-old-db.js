const Database = require('better-sqlite3');
const oldDb = new Database('./imported-database/coffee_machine.db', { readonly: true });
const newDb = new Database('./coffee_machine.db', { readonly: true });

console.log('=== OLD DATABASE PRODUCTS (Full Details) ===\n');
const oldProducts = oldDb.prepare('SELECT * FROM products').all();
oldProducts.forEach(p => {
  console.log(`ID: ${p.id} | goodsId: ${p.goods_id}`);
  console.log(`  Name: ${p.goods_name_en} (${p.goods_name})`);
  console.log(`  Category: ${p.category}`);
  console.log(`  Price: ${p.price}`);
  console.log(`  Type: ${p.type}`);
  console.log(`  matterCodes: ${p.matter_codes}`);
  console.log(`  jsonCodeVal: ${p.json_code_val}`);
  console.log(`  hasLatteArt: ${p.has_latte_art}`);
  console.log(`  path: ${p.path}`);
  console.log('');
});

console.log('\n=== NEW DATABASE PRODUCTS ===\n');
const newProducts = newDb.prepare('SELECT * FROM products').all();
newProducts.forEach(p => {
  console.log(`ID: ${p.id} | goodsId: ${p.goods_id}`);
  console.log(`  Name: ${p.goods_name_en} (${p.goods_name})`);
  console.log(`  Category: ${p.category}`);
  console.log(`  Type: ${p.type}`);
  console.log('');
});

console.log('\n=== COMPARISON ===');
const oldGoodsIds = oldProducts.map(p => p.goods_id);
const newGoodsIds = newProducts.map(p => p.goods_id);
const missingInNew = oldGoodsIds.filter(id => !newGoodsIds.includes(id));
const newOnly = newGoodsIds.filter(id => !oldGoodsIds.includes(id));

console.log('Old products goodsIds:', oldGoodsIds);
console.log('New products goodsIds:', newGoodsIds);
console.log('Missing in new DB (need to migrate):', missingInNew);
console.log('Only in new DB (keep):', newOnly);

oldDb.close();
newDb.close();
