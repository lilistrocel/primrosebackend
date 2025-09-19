const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coffee_machine.db');
const db = new Database(dbPath);

console.log('🔍 Setting up variant classCodes for all products...');

// Get all products
const allProducts = db.prepare(`
  SELECT id, goods_name_en, goods_name, json_code_val, type,
         has_ice_options, iced_class_code, 
         has_shot_options, double_shot_class_code, 
         iced_and_double_class_code
  FROM products 
  WHERE type = 2
  ORDER BY id
`).all();

console.log(`📋 Found ${allProducts.length} coffee products to configure:`);

// Define variant classCode mappings based on original classCodes
const variantMappings = {
  // Espresso variants
  '5001': {
    iced: '5201',
    doubleShot: '5011', 
    icedAndDouble: '5211'
  },
  
  // Cappuccino variants  
  '5002': {
    iced: '5202',
    doubleShot: '5012',
    icedAndDouble: '5212'
  },
  
  // Latte variants
  '5003': {
    iced: '5203', 
    doubleShot: '5013',
    icedAndDouble: '5213'
  },
  
  // Americano variants
  '5004': {
    iced: '5227',  // Your specific iced americano code
    doubleShot: '5014',
    icedAndDouble: '5228'
  },
  
  // Mocha variants (if exists)
  '5005': {
    iced: '5205',
    doubleShot: '5015', 
    icedAndDouble: '5215'
  },
  
  // Macchiato variants (if exists)
  '5006': {
    iced: '5206',
    doubleShot: '5016',
    icedAndDouble: '5216'
  }
};

// Update each product with variant configurations
for (const product of allProducts) {
  try {
    console.log(`\n🔸 Processing: ${product.goods_name_en} (${product.goods_name})`);
    
    // Parse current classCode
    const jsonCodeVal = JSON.parse(product.json_code_val);
    const currentClassCode = jsonCodeVal.find(item => item.classCode)?.classCode;
    console.log(`   Current classCode: ${currentClassCode}`);
    
    // Check if we have variant mappings for this classCode
    const variants = variantMappings[currentClassCode];
    
    if (variants) {
      console.log(`   ✅ Configuring variants for ${product.goods_name_en}:`);
      console.log(`      - Regular: ${currentClassCode}`);
      console.log(`      - Iced: ${variants.iced}`);
      console.log(`      - Double Shot: ${variants.doubleShot}`);
      console.log(`      - Iced + Double: ${variants.icedAndDouble}`);
      
      // Update the product with variant options enabled and classCodes
      const updateQuery = `
        UPDATE products 
        SET has_ice_options = 1,
            iced_class_code = ?,
            has_shot_options = 1, 
            double_shot_class_code = ?,
            iced_and_double_class_code = ?,
            default_ice = 0,
            default_shots = 1
        WHERE id = ?
      `;
      
      const result = db.prepare(updateQuery).run(
        variants.iced,
        variants.doubleShot, 
        variants.icedAndDouble,
        product.id
      );
      
      console.log(`   ✅ Updated successfully!`);
      
    } else {
      console.log(`   ⚠️  No variant mapping found for classCode ${currentClassCode}`);
      console.log(`      Skipping variant configuration for this product`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${product.goods_name_en}:`, error);
  }
}

// Summary report
console.log('\n📊 VARIANT CONFIGURATION SUMMARY:');
const updatedProducts = db.prepare(`
  SELECT goods_name_en, json_code_val, has_ice_options, iced_class_code,
         has_shot_options, double_shot_class_code, iced_and_double_class_code
  FROM products 
  WHERE type = 2 AND has_ice_options = 1
  ORDER BY id
`).all();

console.log(`\n✅ ${updatedProducts.length} products now configured with variants:\n`);

updatedProducts.forEach(product => {
  const jsonCodeVal = JSON.parse(product.json_code_val);
  const originalClassCode = jsonCodeVal.find(item => item.classCode)?.classCode;
  
  console.log(`🔸 ${product.goods_name_en}:`);
  console.log(`   Regular: ${originalClassCode}`);
  console.log(`   Iced: ${product.iced_class_code}`);
  console.log(`   Double Shot: ${product.double_shot_class_code}`);
  console.log(`   Iced + Double: ${product.iced_and_double_class_code}`);
  console.log('');
});

db.close();
console.log('🎉 All variant classCodes configured successfully!');
