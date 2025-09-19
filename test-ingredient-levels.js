/**
 * Test Current Ingredient Levels
 * This will show us what ingredient data the backend currently has
 */

const db = require('./src/database/db');
const { getCurrentIngredientLevels } = require('./src/utils/productAvailability');

async function testIngredientLevels() {
  console.log('🧪 Testing Current Ingredient Levels');
  console.log('='.repeat(50));

  try {
    // Get current ingredient levels
    const currentLevels = getCurrentIngredientLevels(db);
    
    console.log('📊 Current Ingredient Levels from Database:');
    if (Object.keys(currentLevels).length === 0) {
      console.log('❌ NO INGREDIENT DATA FOUND!');
      console.log('   This means the coffee machine hasn\'t sent recent device status updates.');
      console.log('   When ingredient data is empty, all products show as AVAILABLE by default.');
    } else {
      console.log('✅ Found ingredient data:');
      Object.entries(currentLevels).forEach(([code, level]) => {
        const status = level === 0 ? '❌ OUT OF STOCK' : '✅ IN STOCK';
        console.log(`   ${code}: ${level} (${status})`);
      });
    }

    // Get latest device status directly
    console.log('\n🔍 Latest Device Status Entry:');
    const latestStatus = db.getLatestDeviceStatus(1);
    
    if (!latestStatus) {
      console.log('❌ NO DEVICE STATUS ENTRIES FOUND!');
      console.log('   The coffee machine has never sent status updates to this backend.');
    } else {
      console.log('✅ Found device status entry:');
      console.log(`   ID: ${latestStatus.id}`);
      console.log(`   Device ID: ${latestStatus.device_id}`);
      console.log(`   Created: ${latestStatus.created_at}`);
      console.log(`   Matter Status: ${latestStatus.matter_status_json ? 'Present' : 'Missing'}`);
      console.log(`   Device Status: ${latestStatus.device_status_json ? 'Present' : 'Missing'}`);
      
      if (latestStatus.matter_status_json) {
        const matterData = JSON.parse(latestStatus.matter_status_json);
        const outOfStockCount = Object.values(matterData).filter(level => level === 0).length;
        const inStockCount = Object.values(matterData).filter(level => level === 1).length;
        console.log(`   📊 Ingredients: ${inStockCount} in stock, ${outOfStockCount} out of stock`);
      }
    }

    // Check all device status entries to see the update pattern
    console.log('\n📈 Recent Device Status History:');
    const recentEntries = db.database.prepare(`
      SELECT id, device_id, created_at 
      FROM device_status 
      WHERE device_id = 1 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (recentEntries.length === 0) {
      console.log('❌ No device status history found');
    } else {
      console.log(`✅ Found ${recentEntries.length} recent entries:`);
      recentEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ID ${entry.id} - ${entry.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing ingredient levels:', error);
  }

  console.log('\n🎯 Diagnosis:');
  console.log('If you see "NO INGREDIENT DATA FOUND" above, that explains why');
  console.log('availability works on local IP but not tunnel - the coffee machine');
  console.log('is only sending updates to 192.168.10.6:3000, not the tunnel URL.');
}

// Run the test
testIngredientLevels().catch(console.error);
