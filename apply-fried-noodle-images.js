/**
 * Download the 17 generated Recraft product images to the public/uploads
 * subdirectories and update products.path + products.goods_path in the DB.
 *
 * Idempotent — re-run to overwrite if regenerating a subset.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const appDb = require('./src/database/db');
const db = appDb.db;

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3Gl7HC5ffQ6i19CsQOlgGaD2Ep6';

// { goodsId, subdir, filename, resultUrl }
// resultUrl uses raw PNG (rawUrl from show_generation_by_ids).
const IMAGES = [
  // --- Fried (device 2, orange bg) ---
  { goodsId: 8001, subdir: 'fried',    filename: 'french-fries.png',     url: `${CDN}/hf_20260810_091127_af1da059-fd62-46ad-865c-f2839f1cf550.png` },
  { goodsId: 8002, subdir: 'fried',    filename: 'fried-wings.png',      url: `${CDN}/hf_20260810_100312_4f4b4e2c-d3a6-4794-85ea-6f6038dbe1d8.png` },
  { goodsId: 8003, subdir: 'fried',    filename: 'fried-tenders.png',    url: `${CDN}/hf_20260810_100113_c12bb1a5-7992-4142-91d2-d8b95b3068b3.png` },
  { goodsId: 8004, subdir: 'fried',    filename: 'fried-calamari.png',   url: `${CDN}/hf_20260810_100113_891849d1-a2c4-4ddd-a6b3-9fe84213e60a.png` },
  { goodsId: 8005, subdir: 'fried',    filename: 'fish-sticks.png',      url: `${CDN}/hf_20260810_100113_95cf9747-55c5-439f-bcb6-51799b3aa06f.png` },
  { goodsId: 8006, subdir: 'fried',    filename: 'onion-rings.png',      url: `${CDN}/hf_20260810_100113_2de06fcd-e0f8-4116-a705-87dcc8f0bc60.png` },
  { goodsId: 8007, subdir: 'fried',    filename: 'fried-shrimp.png',     url: `${CDN}/hf_20260810_100113_7b840d7d-5430-488d-a164-78255ea313e7.png` },

  // --- Noodles (device 2, amber bg) ---
  { goodsId: 8008, subdir: 'noodles',  filename: 'fresh-noodles.png',    url: `${CDN}/hf_20260810_091127_fef7c82b-2331-46c2-852a-99039d1c7389.png` },
  { goodsId: 8009, subdir: 'noodles',  filename: 'macaroni.png',         url: `${CDN}/hf_20260810_100113_98109a52-fac2-4d99-8f4c-fc8b0220a683.png` },

  // --- Boiled Delicacies (device 2, mint bg) ---
  { goodsId: 8010, subdir: 'boiled',   filename: 'dim-sum.png',          url: `${CDN}/hf_20260810_091127_df95b74c-22d5-495b-9544-dc83f6192765.png` },
  { goodsId: 8011, subdir: 'boiled',   filename: 'dumpling.png',         url: `${CDN}/hf_20260810_100113_2a1fbb21-24cd-4c66-a380-412c0290c732.png` },
  { goodsId: 8012, subdir: 'boiled',   filename: 'wonton.png',           url: `${CDN}/hf_20260810_100113_b539ac2f-22ba-4db2-a657-acc5484f937b.png` },
  { goodsId: 8013, subdir: 'boiled',   filename: 'fish-cake.png',        url: `${CDN}/hf_20260810_100113_dfd84fdb-4094-4cf5-8f81-555f38f3c277.png` },
  { goodsId: 8014, subdir: 'boiled',   filename: 'boiled-calamari.png',  url: `${CDN}/hf_20260810_100113_ad006276-2e85-461d-bc7c-a97f39a3b163.png` },

  // --- Ice Cream (device 4, baby-blue bg) ---
  { goodsId: 28,   subdir: 'icecream', filename: 'vanilla.png',          url: `${CDN}/hf_20260810_091127_59fc2dab-54bd-46c8-9f73-9cadaa6f2636.png` },
  { goodsId: 29,   subdir: 'icecream', filename: 'chocolate.png',        url: `${CDN}/hf_20260810_100113_de54584c-cb49-4245-9a42-129ec15a5402.png` },
  { goodsId: 30,   subdir: 'icecream', filename: 'mix.png',              url: `${CDN}/hf_20260810_100313_ad29c406-c328-40e7-add1-878c109aaa92.png` },
];

const download = (url, dest) => new Promise((resolve, reject) => {
  const req = https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      return download(res.headers.location, dest).then(resolve, reject);
    }
    if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => file.close(err => err ? reject(err) : resolve()));
    file.on('error', reject);
  });
  req.on('error', reject);
});

(async () => {
  const updateStmt = db.prepare(`UPDATE products SET path = ?, goods_path = ?, updated_at = CURRENT_TIMESTAMP WHERE goods_id = ?`);
  const checkStmt = db.prepare(`SELECT goods_id, goods_name_en FROM products WHERE goods_id = ?`);

  let ok = 0, missing = 0;

  for (const img of IMAGES) {
    const product = checkStmt.get(img.goodsId);
    if (!product) {
      console.log(`⚠️  goods_id ${img.goodsId} not found — skipping ${img.filename}`);
      missing++;
      continue;
    }

    const dir = path.join(__dirname, 'public', 'uploads', img.subdir);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, img.filename);
    process.stdout.write(`📥 ${product.goods_name_en.padEnd(22)} → ${img.subdir}/${img.filename} ... `);

    try {
      await download(img.url, dest);
    } catch (e) {
      console.log('FAILED:', e.message);
      continue;
    }

    const relPath = `public/uploads/${img.subdir}/${img.filename}`;
    // Use a leading slash so the existing coffee format matches and getImageUrl
    // resolves cleanly regardless of leading slash — see frontend/src/utils/config.js:212.
    updateStmt.run('/' + relPath, '/' + relPath, img.goodsId);
    console.log('ok');
    ok++;
  }

  console.log(`\n=== Applied ${ok} images, ${missing} missing/skipped ===`);
  appDb.close();
})();
