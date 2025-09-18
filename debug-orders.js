const db = require('./src/database/db');

console.log('🔍 DEBUGGING ORDER ISSUE...');
console.log('');

const orders = db.getAllOrdersForDevice(1);
console.log('📋 Active Orders:');
orders.forEach(o => {
  console.log(`Order ${o.id}: ${o.order_num} - Status: ${o.status}`);
});

console.log('');
console.log('📦 Order Goods for Order 18:');
const goods18 = db.getOrderGoodsForOrder(18);
console.log(goods18);

console.log('');
console.log('📦 Order Goods for Order 21:');  
const goods21 = db.getOrderGoodsForOrder(21);
console.log(goods21);

console.log('');
console.log('🎯 THEORY: Order 18 might not have any coffee items (type=2)');
console.log('This would explain why typeList2 is empty!');

console.log('');
console.log('✅ If Order 18 has no items or non-coffee items, the machine');
console.log('might skip polling because there are no coffee orders to process!');

process.exit(0);
