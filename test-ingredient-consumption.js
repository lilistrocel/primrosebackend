const db = require('./src/database/db');

/**
 * Test script to demonstrate ingredient code consumption
 * This shows how the system processes orders with ingredient codes
 */

async function testIngredientConsumption() {
  try {
    console.log('🧪 Testing Ingredient Code Consumption System');
    console.log('===============================================\n');
    
    // Check if inventory system is available
    if (!db.inventory) {
      console.log('❌ Inventory system not available');
      return;
    }
    
    // Get current inventory levels
    console.log('📦 Current Inventory Levels:');
    const inventoryItems = db.inventory.getAllInventoryItems();
    inventoryItems.forEach(item => {
      console.log(`  ${item.display_name}: ${item.current_stock} ${item.unit}`);
    });
    console.log('');
    
    // Test different order scenarios
    const testOrders = [
      {
        name: 'Latte with BeanCode1, MilkCode1, CupCode3',
        matter_codes: 'BeanCode1,MilkCode1,CupCode3',
        goods_name_en: 'Latte',
        num: 1
      },
      {
        name: 'Espresso with BeanCode2, CupCode2',
        matter_codes: 'BeanCode2,CupCode2',
        goods_name_en: 'Espresso',
        num: 1
      },
      {
        name: 'Cappuccino with BeanCode1, MilkCode2, CupCode3',
        matter_codes: 'BeanCode1,MilkCode2,CupCode3',
        goods_name_en: 'Cappuccino',
        num: 2
      }
    ];
    
    console.log('🔄 Testing Order Consumption Scenarios:\n');
    
    for (const testOrder of testOrders) {
      console.log(`📋 Test Order: ${testOrder.name}`);
      console.log(`   Product: ${testOrder.goods_name_en}`);
      console.log(`   Matter Codes: ${testOrder.matter_codes}`);
      console.log(`   Quantity: ${testOrder.num}`);
      
      // Parse matter codes
      const ingredientCodes = db.inventory.parseMatterCodes(testOrder.matter_codes);
      console.log(`   Parsed Codes:`, ingredientCodes);
      
      // Process consumption
      const transactions = db.inventory.processConsumptionByCodes(
        testOrder, 
        ingredientCodes, 
        999 // Test order ID
      );
      
      console.log(`   ✅ Generated ${transactions.length} consumption transactions:`);
      transactions.forEach(transaction => {
        const item = inventoryItems.find(i => i.id === transaction.item_id);
        if (item) {
          console.log(`     - ${item.display_name}: ${transaction.quantity} ${item.unit}`);
        }
      });
      console.log('');
    }
    
    // Test the mapping system
    console.log('🗺️ Ingredient Code Mapping:');
    console.log('   BeanCode1 → Coffee Beans Type 1');
    console.log('   BeanCode2 → Coffee Beans Type 2');
    console.log('   MilkCode1 → Milk Type 1 (Regular)');
    console.log('   MilkCode2 → Milk Type 2 (Alternative)');
    console.log('   CupCode1 → 8oz Cups');
    console.log('   CupCode2 → 8oz Cups');
    console.log('   CupCode3 → 12oz Cups');
    console.log('');
    
    // Test consumption quantities
    console.log('📊 Consumption Quantities by Product:');
    const products = ['Latte', 'Espresso', 'Cappuccino', 'Americano', 'Cortado'];
    products.forEach(product => {
      const beanQty = db.inventory.getBeanConsumptionQuantity(product);
      const milkQty = db.inventory.getMilkConsumptionQuantity(product);
      console.log(`   ${product}: ${beanQty}g beans, ${milkQty}ml milk`);
    });
    
    console.log('\n✅ Ingredient consumption system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testIngredientConsumption().then(() => {
  console.log('\n🎉 Test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
