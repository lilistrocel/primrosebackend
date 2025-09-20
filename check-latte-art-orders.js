// Check if orders with latte art are being created in the database
const db = require('./src/database/db');

console.log('🔍 Checking for orders with latte art...');

try {
  // Get all orders
  const allOrders = db.db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all();
  console.log(`\n📋 Found ${allOrders.length} recent orders:`);
  
  allOrders.forEach(order => {
    console.log(`  📦 Order ${order.order_num} (ID: ${order.id}) - Status: ${order.status}`);
  });
  
  // Get all order goods with latte art
  const latteArtOrders = db.db.prepare(`
    SELECT og.*, o.order_num, o.status as order_status 
    FROM order_goods og 
    JOIN orders o ON og.order_id = o.id 
    WHERE og.lh_img_path != '' 
    ORDER BY og.created_at DESC
  `).all();
  
  console.log(`\n🎨 Found ${latteArtOrders.length} order items with latte art:`);
  
  if (latteArtOrders.length > 0) {
    latteArtOrders.forEach(item => {
      console.log(`  🎨 Order ${item.order_num}: ${item.goods_name_en}`);
      console.log(`     Image: ${item.lh_img_path}`);
      console.log(`     Status: ${item.status} (Order Status: ${item.order_status})`);
      console.log(`     Created: ${item.created_at}`);
      console.log('');
    });
  } else {
    console.log('  ❌ No orders with latte art found in database');
  }
  
  // Check what the API would return for active orders
  console.log('\n📋 Checking what deviceOrderQueueList would return...');
  const activeOrders = db.getAllOrdersForDevice(1);
  console.log(`Found ${activeOrders.length} active orders for device 1:`);
  
  activeOrders.forEach(order => {
    const goods = db.getOrderGoodsForOrder(order.id);
    const latteArtItems = goods.filter(g => g.lh_img_path && g.lh_img_path !== '');
    console.log(`  📦 Order ${order.order_num}: ${goods.length} items, ${latteArtItems.length} with latte art`);
  });
  
} catch (error) {
  console.error('❌ Error checking orders:', error);
}

console.log('\n✨ Check completed!');
