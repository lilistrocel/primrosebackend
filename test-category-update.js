/**
 * Quick test script to verify category and display order updates
 */

const fetch = require('node-fetch');

async function testCategoryUpdate() {
  const baseUrl = 'http://localhost:3000/api/motong';
  
  try {
    console.log('🔄 Testing category and display order updates...');
    
    // 1. Fetch products to see current state
    console.log('\n1. Fetching current products...');
    const productsResponse = await fetch(`${baseUrl}/products`);
    const productsResult = await productsResponse.json();
    
    if (productsResult.code === 0) {
      console.log(`✅ Found ${productsResult.data.length} products`);
      
      // Show first product with category/display order info
      if (productsResult.data.length > 0) {
        const firstProduct = productsResult.data[0];
        console.log('📦 First product sample:');
        console.log(`   - Name: ${firstProduct.goodsNameEn}`);
        console.log(`   - Category: ${firstProduct.category || 'NOT SET'}`);
        console.log(`   - Display Order: ${firstProduct.displayOrder || 'NOT SET'}`);
      }
    } else {
      console.error('❌ Failed to fetch products:', productsResult.msg);
      return;
    }
    
    // 2. Fetch categories
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await fetch(`${baseUrl}/categories`);
    const categoriesResult = await categoriesResponse.json();
    
    if (categoriesResult.code === 0) {
      console.log(`✅ Found ${categoriesResult.data.length} categories`);
      categoriesResult.data.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.icon}) - Order: ${cat.display_order}`);
      });
    } else {
      console.error('❌ Failed to fetch categories:', categoriesResult.msg);
    }
    
    console.log('\n✅ Category and display order test completed!');
    console.log('\nTo test updates:');
    console.log('1. Go to Item Management in the frontend');
    console.log('2. Edit a product and change its category/display order');
    console.log('3. Go to Kiosk Order page and verify changes appear');
    console.log('4. Check if products are sorted correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running (npm start)');
    console.log('2. Database migrations have been applied');
    console.log('3. Products exist in the database');
  }
}

// Run the test
testCategoryUpdate();
