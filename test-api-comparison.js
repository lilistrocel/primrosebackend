/**
 * Test API Response Comparison
 * Compare responses between local IP and tunnel access
 */

const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      // Ignore SSL certificate issues for self-signed certs
      ...(isHttps && { rejectUnauthorized: false })
    };

    const req = client.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response',
            rawData: data.slice(0, 500) // First 500 chars
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        code: error.code
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function compareAPIResponses() {
  console.log('🧪 API Response Comparison Test');
  console.log('='.repeat(50));

  const urls = {
    'Local IP': 'http://192.168.10.6:3000/api/motong/products',
    'Tunnel': 'https://coffee-api.hydromods.org/api/motong/products'
  };

  const results = {};

  for (const [name, url] of Object.entries(urls)) {
    console.log(`\n🔍 Testing ${name}: ${url}`);
    
    const response = await makeRequest(url);
    results[name] = response;
    
    if (response.success) {
      console.log(`✅ ${name}: Status ${response.status}`);
      
      if (response.data && response.data.data) {
        const products = response.data.data;
        console.log(`📦 Found ${products.length} products`);
        
        // Check availability data in first few products
        const availabilityInfo = products.slice(0, 3).map(product => ({
          name: product.goodsNameEn,
          available: product.available,
          missingIngredients: product.missingIngredients?.length || 0,
          reason: product.availabilityReason
        }));
        
        console.log('📊 Availability sample:');
        availabilityInfo.forEach(info => {
          const status = info.available !== false ? '✅ Available' : '❌ Unavailable';
          console.log(`   ${info.name}: ${status} (${info.reason || 'No reason'})`);
        });
        
        // Check metadata
        if (response.data.meta) {
          console.log('📋 Metadata:');
          console.log(`   Ingredient levels checked: ${response.data.meta.ingredientLevelsChecked}`);
          if (response.data.meta.availability) {
            const avail = response.data.meta.availability;
            console.log(`   Available products: ${avail.availableProducts}/${avail.totalProducts}`);
            console.log(`   Availability rate: ${avail.availabilityRate}%`);
          }
        }
      }
    } else {
      console.log(`❌ ${name}: Failed - ${response.error || 'Unknown error'}`);
      if (response.status) {
        console.log(`   Status: ${response.status}`);
      }
      if (response.rawData) {
        console.log(`   Raw response: ${response.rawData}`);
      }
    }
  }

  // Compare results
  console.log('\n🔍 Comparison Analysis:');
  console.log('='.repeat(30));
  
  const localSuccess = results['Local IP']?.success;
  const tunnelSuccess = results['Tunnel']?.success;
  
  if (localSuccess && tunnelSuccess) {
    const localProducts = results['Local IP'].data.data;
    const tunnelProducts = results['Tunnel'].data.data;
    
    console.log(`Product count: Local=${localProducts.length}, Tunnel=${tunnelProducts.length}`);
    
    // Compare availability for first product
    if (localProducts.length > 0 && tunnelProducts.length > 0) {
      const localFirst = localProducts[0];
      const tunnelFirst = tunnelProducts[0];
      
      console.log('\n📊 First Product Comparison:');
      console.log(`Local:  ${localFirst.goodsNameEn} - Available: ${localFirst.available !== false} (${localFirst.availabilityReason || 'No reason'})`);
      console.log(`Tunnel: ${tunnelFirst.goodsNameEn} - Available: ${tunnelFirst.available !== false} (${tunnelFirst.availabilityReason || 'No reason'})`);
      
      if (localFirst.available !== tunnelFirst.available) {
        console.log('🚨 AVAILABILITY MISMATCH DETECTED!');
        console.log('   This confirms the issue - same server, different availability results');
      } else {
        console.log('✅ Availability matches between local and tunnel');
      }
    }
    
    // Compare metadata
    const localMeta = results['Local IP'].data.meta;
    const tunnelMeta = results['Tunnel'].data.meta;
    
    if (localMeta && tunnelMeta) {
      console.log('\n📋 Metadata Comparison:');
      console.log(`Local ingredient levels checked:  ${localMeta.ingredientLevelsChecked}`);
      console.log(`Tunnel ingredient levels checked: ${tunnelMeta.ingredientLevelsChecked}`);
      
      if (localMeta.ingredientLevelsChecked !== tunnelMeta.ingredientLevelsChecked) {
        console.log('🚨 INGREDIENT DATA MISMATCH!');
        console.log('   The tunnel and local IP are getting different ingredient data');
      }
    }
    
  } else {
    console.log('❌ Cannot compare - one or both requests failed');
    console.log(`Local IP success: ${localSuccess}`);
    console.log(`Tunnel success: ${tunnelSuccess}`);
  }
}

// Run the test
compareAPIResponses().catch(console.error);
