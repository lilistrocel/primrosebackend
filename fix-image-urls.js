#!/usr/bin/env node
/**
 * Fix Image URLs Migration Script
 * Updates all existing database records to use relative image paths
 * instead of hardcoded absolute URLs
 */

const db = require('./src/database/db');

function fixImageUrls() {
  console.log('🔧 Starting Image URL Fix Migration...');
  
  try {
    // Update products table - convert absolute URLs to relative paths
    console.log('📋 Fixing products table image URLs...');
    
    const updateProductsSql = `
      UPDATE products 
      SET goods_path = CASE
        WHEN goods_path LIKE 'http%' THEN 
          REPLACE(
            REPLACE(
              REPLACE(goods_path, 'http://192.168.10.2:3000', ''),
              'http://192.168.10.6:3000', ''
            ),
            'https://coffee-api.hydromods.org', ''
          )
        ELSE goods_path
      END,
      path = CASE
        WHEN path LIKE 'http%' THEN 
          REPLACE(
            REPLACE(
              REPLACE(path, 'http://192.168.10.2:3000', ''),
              'http://192.168.10.6:3000', ''
            ),
            'https://coffee-api.hydromods.org', ''
          )
        ELSE path
      END
      WHERE goods_path LIKE 'http%' OR path LIKE 'http%'
    `;
    
    const productsResult = db.db.prepare(updateProductsSql).run();
    console.log(`✅ Updated ${productsResult.changes} product records`);
    
    // Update order_goods table - convert absolute URLs to relative paths
    console.log('📋 Fixing order_goods table image URLs...');
    
    const updateOrderGoodsSql = `
      UPDATE order_goods 
      SET goods_path = CASE
        WHEN goods_path LIKE 'http%' THEN 
          REPLACE(
            REPLACE(
              REPLACE(goods_path, 'http://192.168.10.2:3000', ''),
              'http://192.168.10.6:3000', ''
            ),
            'https://coffee-api.hydromods.org', ''
          )
        ELSE goods_path
      END,
      path = CASE
        WHEN path LIKE 'http%' THEN 
          REPLACE(
            REPLACE(
              REPLACE(path, 'http://192.168.10.2:3000', ''),
              'http://192.168.10.6:3000', ''
            ),
            'https://coffee-api.hydromods.org', ''
          )
        ELSE path
      END
      WHERE goods_path LIKE 'http%' OR path LIKE 'http%'
    `;
    
    const orderGoodsResult = db.db.prepare(updateOrderGoodsSql).run();
    console.log(`✅ Updated ${orderGoodsResult.changes} order goods records`);
    
    // Show sample of updated records
    console.log('📊 Sample updated records:');
    const sampleProducts = db.db.prepare(`
      SELECT id, goods_name_en, goods_path, path 
      FROM products 
      WHERE goods_path IS NOT NULL AND goods_path != ''
      LIMIT 3
    `).all();
    
    sampleProducts.forEach(product => {
      console.log(`  - ${product.goods_name_en}: ${product.goods_path}`);
    });
    
    console.log('🎉 Image URL migration completed successfully!');
    console.log('');
    console.log('✅ All image URLs are now relative paths');
    console.log('✅ Frontend will construct full URLs dynamically');
    console.log('✅ Works with both local and tunnel access');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixImageUrls();
} else {
  module.exports = fixImageUrls;
}
