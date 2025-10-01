const db = require('./src/database/db');

console.log('🔍 Testing inventory consumption for recent orders...\n');

// Get a recent completed order
const recentOrder = db.db.prepare('SELECT * FROM orders WHERE status = 5 ORDER BY created_at DESC LIMIT 1').get();

if (!recentOrder) {
  console.log('❌ No completed orders found');
  process.exit(1);
}

console.log(`📋 Testing with completed Order ${recentOrder.id}: ${recentOrder.order_num}`);
console.log(`   Status: ${recentOrder.status} (Completed)`);
console.log(`   Created: ${recentOrder.created_at}\n`);

// Get order items for this order
const orderItems = db.db.prepare('SELECT * FROM order_goods WHERE order_id = ?').all(recentOrder.id);

console.log('📦 Order Items:');
orderItems.forEach(item => {
  console.log(`   ${item.goods_name_en}`);
  console.log(`   Matter Codes: ${item.matter_codes || 'None'}`);
  console.log(`   Quantity: ${item.num}`);
  console.log('');
});

// Test the parsing logic
console.log('🔍 Testing matter code parsing:');
orderItems.forEach(item => {
  if (item.matter_codes) {
    const parsedCodes = db.inventory.parseMatterCodes(item.matter_codes);
    console.log(`   ${item.goods_name_en}:`);
    console.log(`      Parsed codes:`, parsedCodes);
    console.log('');
  }
});

// Test inventory consumption processing
console.log('🔄 Testing inventory consumption processing:');
try {
  const transactions = db.inventory.processOrderConsumption(recentOrder.id);
  
  if (transactions && transactions.length > 0) {
    console.log(`✅ Generated ${transactions.length} consumption transactions:`);
    transactions.forEach((transaction, index) => {
      const item = db.inventory.getInventoryItemById(transaction.item_id);
      console.log(`   ${index + 1}. ${item ? item.display_name : 'Unknown Item'}: -${transaction.quantity}${item ? item.unit : 'units'}`);
      console.log(`      Notes: ${transaction.notes}`);
    });
  } else {
    console.log('ℹ️ No consumption transactions generated');
  }
} catch (error) {
  console.error('❌ Error processing inventory consumption:', error);
}

// Check current inventory levels
console.log('\n📊 Current Inventory Levels:');
const inventoryItems = db.inventory.getAllInventoryItems();
inventoryItems.forEach(item => {
  console.log(`   ${item.display_name}: ${item.current_stock} ${item.unit}`);
});

console.log('\n✅ Test complete!');
