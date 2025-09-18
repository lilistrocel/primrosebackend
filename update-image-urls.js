#!/usr/bin/env node

/**
 * Update Image URLs Script
 * 
 * This script updates all hardcoded localhost:3000 URLs in the database
 * to use the current network configuration.
 * 
 * Run this after changing IP addresses to fix existing database records.
 */

const db = require('./src/database/db');
const networkConfig = require('./src/config/network');

console.log('🔄 Updating image URLs in database...');
console.log(`📍 New base URL: ${networkConfig.getFrontendApiUrl()}`);

try {
  // Update products table
  const products = db.getAllProducts();
  let productUpdates = 0;
  
  for (const product of products) {
    if (product.goods_path && product.goods_path.includes('localhost:3000')) {
      const newGoodsPath = product.goods_path.replace(
        'http://localhost:3000',
        networkConfig.getFrontendApiUrl()
      );
      
      try {
        db.updateProduct(product.id, { goodsPath: newGoodsPath });
        console.log(`✅ Updated product ${product.id}: ${product.goods_name_en}`);
        productUpdates++;
      } catch (error) {
        console.error(`❌ Error updating product ${product.id}:`, error.message);
      }
    }
  }
  
  // Update order_goods table  
  const orderGoods = db.db.prepare('SELECT * FROM order_goods WHERE goods_path LIKE ?').all('%localhost:3000%');
  let orderGoodsUpdates = 0;
  
  for (const goods of orderGoods) {
    const newGoodsPath = goods.goods_path.replace(
      'http://localhost:3000',
      networkConfig.getFrontendApiUrl()
    );
    
    try {
      const updateStmt = db.db.prepare('UPDATE order_goods SET goods_path = ? WHERE id = ?');
      updateStmt.run(newGoodsPath, goods.id);
      console.log(`✅ Updated order goods ${goods.id}: ${goods.goods_name_en}`);
      orderGoodsUpdates++;
    } catch (error) {
      console.error(`❌ Error updating order goods ${goods.id}:`, error.message);
    }
  }
  
  console.log('');
  console.log('🎉 Database URL update completed!');
  console.log(`📊 Results:`);
  console.log(`   Products updated: ${productUpdates}`);
  console.log(`   Order goods updated: ${orderGoodsUpdates}`);
  console.log(`   Total records updated: ${productUpdates + orderGoodsUpdates}`);
  
  if (productUpdates === 0 && orderGoodsUpdates === 0) {
    console.log('✨ No localhost URLs found - database is already up to date!');
  }
  
} catch (error) {
  console.error('❌ Error updating database URLs:', error);
  process.exit(1);
}

console.log('');
console.log('🚀 Next steps:');
console.log('   1. Restart backend: npm start');
console.log('   2. Restart frontend: cd frontend && npm start');
console.log('   3. Test external access from iPad or other device');
