/**
 * Test Frontend Request with Availability Fields
 * This simulates the exact request your frontend is sending
 */

const db = require('./src/database/db');

async function testFrontendRequest() {
  console.log('🧪 Testing Frontend Request with Availability Fields');
  console.log('='.repeat(50));

  // This is the exact request body your frontend is sending
  const frontendRequestBody = {
    id: 20,
    goodsId: 9,
    deviceGoodsId: 9,
    goodsName: '美式咖啡',
    goodsNameEn: 'Americano',
    goodsNameOt: 'أمريكانو',
    availabilityReason: "Missing ingredients: CoffeeMatter10",
    available: false,
    category: "Classics",
    createdAt: "2025-09-18 08:31:11",
    defaultIce: true,
    default_bean_code: 1,
    default_milk_code: 1,
    default_shots: 1,
    deviceGoodsId: 9,
    displayOrder: 0,
    doubleShotClassCode: null,
    goodsId: 9,
    goodsImg: null,
    goodsName: "美式咖啡",
    goodsNameEn: "Americano",
    goodsNameOt: "أمريكانو",
    goodsPath: "http://192.168.10.2:3000/public/uploads/image-1758184366696-760385247.png",
    has_bean_options: true,
    has_ice_options: false,
    has_milk_options: false,
    has_shot_options: false,
    icedAndDoubleClassCode: null,
    icedClassCode: null,
    jsonCodeVal: "[{\"classCode\":\"5002\"},{\"CupCode\":\"2\"},{\"BeanCode\":\"1\"}]",
    matterCodes: "CoffeeMatter10,CoffeeMatter11,CoffeeMatter5",
    missingIngredients: [{code: "CoffeeMatter10", level: 0, status: "critical"}],
    path: "/public/uploads/image-1758184366696-760385247.png",
    price: 2,
    rePrice: 2,
    status: "active",
    type: 2,
    updatedAt: "2025-09-19 17:27:50"
  };

  console.log('📤 Frontend request body contains these fields:');
  Object.keys(frontendRequestBody).forEach(key => {
    console.log(`   ${key}: ${typeof frontendRequestBody[key]}`);
  });

  console.log('\n🔍 Testing database update with this request...');
  
  try {
    const result = db.updateProduct(20, frontendRequestBody);
    console.log('✅ SUCCESS: Database update completed!');
    console.log('📊 Update result:', result);

    // Verify the update worked
    const updatedProduct = db.getProductById(20);
    console.log(`\n📋 Updated Matter Codes: "${updatedProduct.matter_codes}"`);
    console.log(`📋 Updated JSON Code: ${updatedProduct.json_code_val}`);

  } catch (error) {
    console.error('❌ ERROR: Database update failed!');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🎉 Frontend Request Test Complete!');
}

// Run the test
testFrontendRequest().catch(console.error);
