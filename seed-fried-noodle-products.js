/**
 * Seed fried + noodle + boiled-delicacy products for the new machine (deviceId=2, type=1).
 *
 * Idempotent: skips any product whose goods_id already exists. Re-run to add
 * newly listed items without duplicating rows.
 *
 * Catalog (from the machine spec — see plan /home/noobcity/.claude/plans/):
 *   Fried  (classCode 60001, foodType "2"): French fries..Fried shrimp (firedType 21-27)
 *   Noodles (classCode 60009, foodType "1"): Fresh noodles(1), Macaroni(5)
 *   Boiled Delicacies (classCode 60010, foodType "1"): Dim Sum(6)..Calamari(10)
 *
 * The noodle/boiled items have has_noodle_spec_options=1; the kiosk modal
 * rewrites noodleSpecifications at order time (0-5, 5=BeefAndSoup special).
 */

// Load the app's db module so the auto-migration in initializeSchema() runs
// and the new has_noodle_spec_options / default_noodle_spec columns are added
// before we try to INSERT into them. Then use its raw handle for our seed.
const appDb = require('./src/database/db');
const db = appDb.db;

const friedJson = (firedType) =>
  JSON.stringify([
    { classCode: '60001' },
    { foodType: '2' },
    { firedType: String(firedType) }
  ]);

const noodleJson = (classCode, noodleType) =>
  JSON.stringify([
    { classCode: String(classCode) },
    { foodType: '1' },
    { noodleType: String(noodleType) },
    { noodleSpecifications: '0' }
  ]);

const products = [
  // Fried line — foodType 2, firedType 21-27
  { goodsId: 8001, name: 'French Fries',   category: 'Fried', firedType: 21 },
  { goodsId: 8002, name: 'Fried Wings',    category: 'Fried', firedType: 22 },
  { goodsId: 8003, name: 'Fried Tenders',  category: 'Fried', firedType: 23 },
  { goodsId: 8004, name: 'Calamari',       category: 'Fried', firedType: 24 },
  { goodsId: 8005, name: 'Fish Sticks',    category: 'Fried', firedType: 25 },
  { goodsId: 8006, name: 'Onion Rings',    category: 'Fried', firedType: 26 },
  { goodsId: 8007, name: 'Fried Shrimp',   category: 'Fried', firedType: 27 },

  // Noodle line (60009)
  { goodsId: 8008, name: 'Fresh Noodles',  category: 'Noodles', classCode: 60009, noodleType: 1 },
  { goodsId: 8009, name: 'Macaroni',       category: 'Noodles', classCode: 60009, noodleType: 5 },

  // Boiled Delicacies (60010)
  { goodsId: 8010, name: 'Dim Sum',        category: 'Boiled Delicacies', classCode: 60010, noodleType: 6 },
  { goodsId: 8011, name: 'Dumpling',       category: 'Boiled Delicacies', classCode: 60010, noodleType: 7 },
  { goodsId: 8012, name: 'Wonton',         category: 'Boiled Delicacies', classCode: 60010, noodleType: 8 },
  { goodsId: 8013, name: 'Fish Cake',      category: 'Boiled Delicacies', classCode: 60010, noodleType: 9 },
  { goodsId: 8014, name: 'Boiled Calamari',category: 'Boiled Delicacies', classCode: 60010, noodleType: 10 }
];

// Ensure the kiosk category tabs exist. The kiosk only shows tabs for rows
// present in the `categories` table (and only when at least one product's
// free-text `category` string matches the row's `name`).
const categoryRows = [
  { name: 'Fried',              icon: '🍟', display_order: 20 },
  { name: 'Noodles',            icon: '🍜', display_order: 21 },
  { name: 'Boiled Delicacies',  icon: '🥟', display_order: 22 }
];
const catExists = db.prepare('SELECT id FROM categories WHERE name = ?');
const catInsert = db.prepare(`
  INSERT INTO categories (name, icon, display_order, is_active) VALUES (?, ?, ?, 1)
`);
for (const c of categoryRows) {
  if (catExists.get(c.name)) {
    console.log(`⏭️  category "${c.name}" already exists — skipping`);
    continue;
  }
  catInsert.run(c.name, c.icon, c.display_order);
  console.log(`✅ Created category "${c.name}" ${c.icon}`);
}

const insert = db.prepare(`
  INSERT INTO products (
    goods_id, device_goods_id, goods_name, goods_name_en, goods_name_ot,
    type, price, re_price, matter_codes, json_code_val,
    goods_img, path, goods_path, status, display_order, category,
    has_noodle_spec_options, default_noodle_spec
  ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, '', ?, NULL, '', '', 'active', ?, ?, ?, 0)
`);

const exists = db.prepare('SELECT id FROM products WHERE goods_id = ?');

let inserted = 0;
let skipped = 0;

for (const [i, p] of products.entries()) {
  if (exists.get(p.goodsId)) {
    console.log(`⏭️  goods_id ${p.goodsId} (${p.name}) already exists — skipping`);
    skipped++;
    continue;
  }

  const isFried = p.category === 'Fried';
  const jsonCodeVal = isFried
    ? friedJson(p.firedType)
    : noodleJson(p.classCode, p.noodleType);
  const hasNoodleSpec = isFried ? 0 : 1;

  insert.run(
    p.goodsId,
    p.goodsId,            // device_goods_id mirrors goods_id
    p.name,               // goods_name (no Chinese name for these)
    p.name,               // goods_name_en
    '',                   // goods_name_ot
    5.00,                 // price — placeholder, edit in ItemManagement
    5.00,                 // re_price
    jsonCodeVal,
    i + 1,                // display_order
    p.category,
    hasNoodleSpec
  );

  console.log(`✅ Inserted ${p.name}  goods_id=${p.goodsId}  category=${p.category}`);
  console.log(`     jsonCodeVal = ${jsonCodeVal}`);
  inserted++;
}

console.log(`\n=== Seeding complete: ${inserted} inserted, ${skipped} skipped ===`);
appDb.close();
