/**
 * Test Script for Ingredient Availability System
 * Tests various ingredient combinations to verify product availability logic
 */

const DatabaseManager = require('./src/database/db');
const { checkProductAvailability, checkMultipleProductsAvailability, getCurrentIngredientLevels } = require('./src/utils/productAvailability');

// Initialize database
const db = new DatabaseManager();

async function testIngredientAvailability() {
  console.log('🧪 Testing Ingredient Availability System');
  console.log('='.repeat(50));

  // Test 1: Get all products
  console.log('\n📦 Step 1: Getting all products...');
  const products = db.getAllProducts();
  console.log(`Found ${products.length} products`);

  // Test 2: Mock different ingredient scenarios
  const testScenarios = [
    {
      name: 'All Ingredients Available',
      ingredientLevels: {
        CoffeeMatter1: 1,  // 8oz Paper Cups
        CoffeeMatter2: 1,  // Coffee Beans
        CoffeeMatter3: 1,  // Milk
        CoffeeMatter4: 1,  // Ice
        CoffeeMatter5: 1,  // Coffee Machine Water
        CoffeeMatter6: 1,  // Cup #1
        CoffeeMatter7: 1,  // 2 Cup Sugar
        CoffeeMatter8: 1,  // 3 Cups
        CoffeeMatter9: 1,  // Printer Paper
        CoffeeMatter10: 1, // 12oz Paper Cups
        CoffeeMatter11: 1, // Coffee Machine Syrup
        CoffeeMatter12: 1, // Robot Syrup
        CoffeeMatter13: 1, // Coffee Beans 2
        CoffeeMatter14: 1, // Milk 2
        CoffeeMatter15: 1  // Ice Machine Water
      }
    },
    {
      name: 'No Cups Available',
      ingredientLevels: {
        CoffeeMatter1: 0,  // 8oz Paper Cups - OUT
        CoffeeMatter2: 1,  // Coffee Beans
        CoffeeMatter3: 1,  // Milk
        CoffeeMatter4: 1,  // Ice
        CoffeeMatter5: 1,  // Coffee Machine Water
        CoffeeMatter6: 0,  // Cup #1 - OUT
        CoffeeMatter7: 1,  // 2 Cup Sugar
        CoffeeMatter8: 0,  // 3 Cups - OUT
        CoffeeMatter9: 1,  // Printer Paper
        CoffeeMatter10: 0, // 12oz Paper Cups - OUT
        CoffeeMatter11: 1, // Coffee Machine Syrup
        CoffeeMatter12: 1, // Robot Syrup
        CoffeeMatter13: 1, // Coffee Beans 2
        CoffeeMatter14: 1, // Milk 2
        CoffeeMatter15: 1  // Ice Machine Water
      }
    },
    {
      name: 'No Coffee Beans',
      ingredientLevels: {
        CoffeeMatter1: 1,  // 8oz Paper Cups
        CoffeeMatter2: 0,  // Coffee Beans - OUT
        CoffeeMatter3: 1,  // Milk
        CoffeeMatter4: 1,  // Ice
        CoffeeMatter5: 1,  // Coffee Machine Water
        CoffeeMatter6: 1,  // Cup #1
        CoffeeMatter7: 1,  // 2 Cup Sugar
        CoffeeMatter8: 1,  // 3 Cups
        CoffeeMatter9: 1,  // Printer Paper
        CoffeeMatter10: 1, // 12oz Paper Cups
        CoffeeMatter11: 1, // Coffee Machine Syrup
        CoffeeMatter12: 1, // Robot Syrup
        CoffeeMatter13: 0, // Coffee Beans 2 - OUT
        CoffeeMatter14: 1, // Milk 2
        CoffeeMatter15: 1  // Ice Machine Water
      }
    },
    {
      name: 'Critical Shortage',
      ingredientLevels: {
        CoffeeMatter1: 0,  // 8oz Paper Cups - OUT
        CoffeeMatter2: 0,  // Coffee Beans - OUT
        CoffeeMatter3: 0,  // Milk - OUT
        CoffeeMatter4: 1,  // Ice
        CoffeeMatter5: 0,  // Coffee Machine Water - OUT
        CoffeeMatter6: 0,  // Cup #1 - OUT
        CoffeeMatter7: 0,  // 2 Cup Sugar - OUT
        CoffeeMatter8: 0,  // 3 Cups - OUT
        CoffeeMatter9: 1,  // Printer Paper
        CoffeeMatter10: 0, // 12oz Paper Cups - OUT
        CoffeeMatter11: 0, // Coffee Machine Syrup - OUT
        CoffeeMatter12: 0, // Robot Syrup - OUT
        CoffeeMatter13: 0, // Coffee Beans 2 - OUT
        CoffeeMatter14: 0, // Milk 2 - OUT
        CoffeeMatter15: 0  // Ice Machine Water - OUT
      }
    }
  ];

  // Test each scenario
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🧪 Test Scenario ${i + 1}: ${scenario.name}`);
    console.log('-'.repeat(30));

    // Transform products to frontend format for testing
    const transformedProducts = products.map(product => ({
      id: product.id,
      goodsId: product.goods_id,
      goodsName: product.goods_name,
      goodsNameEn: product.goods_name_en,
      matterCodes: product.matter_codes,
      price: parseFloat(product.price),
      status: product.status
    }));

    // Check availability for all products
    const availabilityMap = checkMultipleProductsAvailability(transformedProducts, scenario.ingredientLevels);
    
    // Display results
    const availableProducts = [];
    const unavailableProducts = [];
    
    Object.entries(availabilityMap).forEach(([productId, availability]) => {
      if (availability.available) {
        availableProducts.push(availability.productName);
      } else {
        unavailableProducts.push({
          name: availability.productName,
          missing: availability.missingIngredients.map(ing => ing.code).join(', '),
          reason: availability.reason
        });
      }
    });
    
    console.log(`✅ Available Products (${availableProducts.length}):`);
    availableProducts.forEach(name => console.log(`   - ${name}`));
    
    console.log(`\n❌ Unavailable Products (${unavailableProducts.length}):`);
    unavailableProducts.forEach(product => {
      console.log(`   - ${product.name}`);
      console.log(`     Missing: ${product.missing}`);
      console.log(`     Reason: ${product.reason}`);
    });
    
    // Calculate availability percentage
    const availabilityRate = ((availableProducts.length / transformedProducts.length) * 100).toFixed(1);
    console.log(`\n📊 Availability Rate: ${availabilityRate}%`);
  }

  // Test 3: Individual product availability check
  console.log('\n\n🔍 Individual Product Availability Tests');
  console.log('='.repeat(50));

  const sampleProduct = products.find(p => p.goods_name_en === 'Americano');
  if (sampleProduct) {
    console.log(`\n☕ Testing Americano (matterCodes: ${sampleProduct.matter_codes})`);
    
    // Test with different ingredient combinations
    const testCases = [
      { name: 'All Available', levels: { CoffeeMatter12: 1, CoffeeMatter11: 1, CoffeeMatter1: 1, CoffeeMatter2: 1, CoffeeMatter5: 1 } },
      { name: 'Missing Syrup', levels: { CoffeeMatter12: 0, CoffeeMatter11: 1, CoffeeMatter1: 1, CoffeeMatter2: 1, CoffeeMatter5: 1 } },
      { name: 'Missing Cups', levels: { CoffeeMatter12: 1, CoffeeMatter11: 1, CoffeeMatter1: 0, CoffeeMatter2: 1, CoffeeMatter5: 1 } },
      { name: 'Missing Everything', levels: { CoffeeMatter12: 0, CoffeeMatter11: 0, CoffeeMatter1: 0, CoffeeMatter2: 0, CoffeeMatter5: 0 } }
    ];
    
    testCases.forEach(testCase => {
      const result = checkProductAvailability(sampleProduct.matter_codes, testCase.levels);
      console.log(`\n   ${testCase.name}:`);
      console.log(`   Available: ${result.available ? '✅' : '❌'}`);
      console.log(`   Reason: ${result.reason}`);
      if (result.missingIngredients.length > 0) {
        console.log(`   Missing: ${result.missingIngredients.map(ing => ing.code).join(', ')}`);
      }
    });
  }

  console.log('\n🎉 Ingredient Availability Testing Complete!');
  console.log('='.repeat(50));
}

// Run the test
testIngredientAvailability().catch(console.error);
