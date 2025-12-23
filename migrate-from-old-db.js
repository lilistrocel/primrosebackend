/**
 * Migration Script: Replace coffee products from old database
 * - Removes existing coffee products (type=2) from new database
 * - Imports all coffee products from old database
 * - Preserves ice cream products (type=3)
 */

const Database = require('better-sqlite3');

const OLD_DB_PATH = './imported-database/coffee_machine.db';
const NEW_DB_PATH = './coffee_machine.db';

console.log('=================================================');
console.log('  MIGRATION: Old Database -> New Database');
console.log('=================================================\n');

// Open databases
const oldDb = new Database(OLD_DB_PATH, { readonly: true });
const newDb = new Database(NEW_DB_PATH);

try {
  // Step 1: Get current state
  console.log('📊 BEFORE MIGRATION:');
  const beforeProducts = newDb.prepare('SELECT id, goods_id, goods_name_en, type, category FROM products').all();
  beforeProducts.forEach(p => console.log(`  - ${p.goods_name_en} (goodsId: ${p.goods_id}, type: ${p.type})`));
  console.log(`  Total: ${beforeProducts.length} products\n`);

  // Step 2: Delete existing coffee products (type=2) from new database
  console.log('🗑️  Removing existing coffee products (type=2)...');
  const deleteResult = newDb.prepare('DELETE FROM products WHERE type = 2').run();
  console.log(`  Deleted ${deleteResult.changes} coffee products\n`);

  // Step 3: Get all products from old database
  console.log('📦 Fetching products from old database...');
  const oldProducts = oldDb.prepare('SELECT * FROM products').all();
  console.log(`  Found ${oldProducts.length} products\n`);

  // Step 4: Insert products from old database
  console.log('📥 Inserting products from old database...');

  const insertStmt = newDb.prepare(`
    INSERT INTO products (
      goods_id, device_goods_id, goods_name, goods_name_en, goods_name_ot,
      type, price, re_price, matter_codes, json_code_val,
      goods_img, path, goods_path, status, category, display_order,
      has_bean_options, has_milk_options, has_ice_options, has_shot_options,
      default_bean_code, default_milk_code, default_ice, default_shots,
      iced_class_code, double_shot_class_code, iced_and_double_class_code,
      has_latte_art, has_topping_options, default_topping_type
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  let insertedCount = 0;
  for (const p of oldProducts) {
    try {
      insertStmt.run(
        p.goods_id,
        p.device_goods_id,
        p.goods_name,
        p.goods_name_en,
        p.goods_name_ot,
        p.type,
        p.price,
        p.re_price,
        p.matter_codes,
        p.json_code_val,
        p.goods_img,
        p.path,
        p.goods_path,
        p.status || 'active',
        p.category || 'Classics',
        p.display_order || 0,
        p.has_bean_options || 0,
        p.has_milk_options || 0,
        p.has_ice_options || 0,
        p.has_shot_options || 0,
        p.default_bean_code || 1,
        p.default_milk_code || 1,
        p.default_ice || 0,
        p.default_shots || 1,
        p.iced_class_code || null,
        p.double_shot_class_code || null,
        p.iced_and_double_class_code || null,
        p.has_latte_art || 0,
        0, // has_topping_options (new field, default 0 for coffee)
        0  // default_topping_type (new field, default 0)
      );
      insertedCount++;
      console.log(`  ✅ ${p.goods_name_en} (goodsId: ${p.goods_id})`);
    } catch (err) {
      console.log(`  ❌ Failed to insert ${p.goods_name_en}: ${err.message}`);
    }
  }
  console.log(`\n  Inserted ${insertedCount} products from old database\n`);

  // Step 5: Verify final state
  console.log('📊 AFTER MIGRATION:');
  const afterProducts = newDb.prepare('SELECT id, goods_id, goods_name_en, type, category FROM products ORDER BY type, goods_id').all();
  afterProducts.forEach(p => console.log(`  - ${p.goods_name_en} (goodsId: ${p.goods_id}, type: ${p.type}, category: ${p.category})`));
  console.log(`  Total: ${afterProducts.length} products\n`);

  console.log('=================================================');
  console.log('  ✅ MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('=================================================');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  oldDb.close();
  newDb.close();
}
