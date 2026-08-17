/**
 * Seed the Fried Egg product for the AbuEgg machine (deviceId=3, type=4).
 *
 * Idempotent — skips if goods_id 9001 already exists. The category row is
 * inserted with INSERT OR IGNORE so re-running is safe.
 *
 * AbuEgg reads only typeList4 items and aborts the ENTIRE poll cycle if any
 * item's classCode != "003001" (OrderCilent.cs:75 uses `return`, not `continue`).
 * Therefore every product with type=4 that lands in this device's queue must
 * carry exactly `[{"classCode":"003001"}]`.
 */

const appDb = require('./src/database/db');
const db = appDb.db;

// Ensure the kiosk category tab exists for eggs.
const catExists = db.prepare('SELECT id FROM categories WHERE name = ?');
if (!catExists.get('Eggs')) {
  db.prepare(`INSERT INTO categories (name, icon, display_order, is_active) VALUES (?, ?, ?, 1)`)
    .run('Eggs', '🍳', 23);
  console.log('✅ Created category "Eggs" 🍳');
} else {
  console.log('⏭️  category "Eggs" already exists — skipping');
}

const eggJson = JSON.stringify([{ classCode: '003001' }]);

const GOODS_ID = 9001;
const productExists = db.prepare('SELECT id FROM products WHERE goods_id = ?').get(GOODS_ID);
if (productExists) {
  console.log(`⏭️  goods_id ${GOODS_ID} (Fried Egg) already exists — skipping`);
} else {
  db.prepare(`
    INSERT INTO products (
      goods_id, device_goods_id, goods_name, goods_name_en, goods_name_ot,
      type, price, re_price, matter_codes, json_code_val,
      goods_img, path, goods_path, status, display_order, category,
      has_noodle_spec_options, default_noodle_spec
    ) VALUES (?, ?, ?, ?, ?, 4, ?, ?, ?, ?, NULL, '', '', 'active', ?, ?, 0, 0)
  `).run(
    GOODS_ID,
    GOODS_ID,           // device_goods_id mirrors goods_id
    'Fried Egg',        // goods_name
    'Fried Egg',        // goods_name_en
    '',                 // goods_name_ot
    5.00,               // price — placeholder, edit in ItemManagement
    5.00,               // re_price
    'EggMatter1',       // matter_codes — availability check disables when egg liquid = 0
    eggJson,
    1,                  // display_order
    'Eggs'
  );
  console.log('✅ Inserted Fried Egg  goods_id=9001  category=Eggs');
  console.log('     jsonCodeVal =', eggJson);
}

appDb.close();
