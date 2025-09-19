/**
 * Test what happens when there are no ingredient levels
 * This simulates what's probably happening on your tunnel server
 */

const db = require('./src/database/db');
const { checkMultipleProductsAvailability, getCurrentIngredientLevels } = require('./src/utils/productAvailability');

async function testEmptyIngredients() {
  console.log('🧪 Testing Product Availability with Empty Ingredient Data');
  console.log('='.repeat(60));

  try {
    // Get some products to test
    const products = db.getAllProducts().slice(0, 3); // Just test first 3 products
    
    console.log('📦 Testing Products:');
    products.forEach(product => {
      console.log(`   ${product.goods_name_en}: matterCodes="${product.matter_codes}"`);
    });

    // Transform to frontend format (simplified)
    const transformedProducts = products.map(product => ({
      goodsId: product.goods_id,
      goodsNameEn: product.goods_name_en,
      matterCodes: product.matter_codes
    }));

    console.log('\n🔍 Test 1: With Current Ingredient Data (Local Scenario)');
    const currentLevels = getCurrentIngredientLevels(db);
    const availabilityWithData = checkMultipleProductsAvailability(transformedProducts, currentLevels);
    
    Object.entries(availabilityWithData).forEach(([goodsId, info]) => {
      const status = info.available ? '✅ AVAILABLE' : '❌ UNAVAILABLE';
      console.log(`   Product ${goodsId}: ${status} (${info.reason})`);
    });

    console.log('\n🔍 Test 2: With Empty Ingredient Data (Tunnel Scenario)');
    const emptyLevels = {}; // This simulates what happens on tunnel server
    const availabilityWithoutData = checkMultipleProductsAvailability(transformedProducts, emptyLevels);
    
    Object.entries(availabilityWithoutData).forEach(([goodsId, info]) => {
      const status = info.available ? '✅ AVAILABLE' : '❌ UNAVAILABLE';
      console.log(`   Product ${goodsId}: ${status} (${info.reason})`);
    });

    console.log('\n🎯 Analysis:');
    const localAvailable = Object.values(availabilityWithData).filter(p => p.available).length;
    const tunnelAvailable = Object.values(availabilityWithoutData).filter(p => p.available).length;
    
    console.log(`Local IP (with ingredient data): ${localAvailable}/${products.length} products available`);
    console.log(`Tunnel (without ingredient data): ${tunnelAvailable}/${products.length} products available`);
    
    if (tunnelAvailable > localAvailable) {
      console.log('\n✅ CONFIRMED: This matches your symptoms!');
      console.log('   - Local IP shows some products as UNAVAILABLE (correct ingredient checking)');
      console.log('   - Tunnel shows all products as AVAILABLE (no ingredient data to check)');
      console.log('\n🚀 Solution: Configure coffee machine to send updates to tunnel URL');
      console.log('   OR copy current database to remote server');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testEmptyIngredients().catch(console.error);
