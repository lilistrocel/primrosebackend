/**
 * Debug Script for MatterCodes Update Issue
 * This script helps debug why matterCodes aren't updating in Item Manager
 */

const db = require('./src/database/db');

async function debugMatterCodes() {
  console.log('🔍 Debugging MatterCodes Update Issue');
  console.log('='.repeat(50));

  // Step 1: Check current products and their matterCodes
  console.log('\n📦 Step 1: Current Products and MatterCodes');
  const products = db.getAllProducts();
  
  products.forEach(product => {
    console.log(`\n📋 Product: ${product.goods_name_en} (ID: ${product.id})`);
    console.log(`   Matter Codes: "${product.matter_codes}"`);
    console.log(`   JSON Code: ${product.json_code_val}`);
  });

  // Step 2: Test updating matterCodes for Americano
  const americano = products.find(p => p.goods_name_en === 'Americano');
  if (americano) {
    console.log(`\n🧪 Step 2: Testing MatterCodes Update for Americano`);
    console.log(`Original Matter Codes: "${americano.matter_codes}"`);
    
    const newMatterCodes = 'CoffeeMatter1,CoffeeMatter2,CoffeeMatter3,CoffeeMatter4,CoffeeMatter5';
    console.log(`New Matter Codes: "${newMatterCodes}"`);
    
    try {
      const updateData = {
        matterCodes: newMatterCodes
      };
      
      console.log('📤 Sending update request:', updateData);
      const result = db.updateProduct(americano.id, updateData);
      console.log('✅ Update result:', result);
      
      // Check if it was actually updated
      const updatedProduct = db.getProductById(americano.id);
      console.log(`📋 Updated Matter Codes: "${updatedProduct.matter_codes}"`);
      
      if (updatedProduct.matter_codes === newMatterCodes) {
        console.log('✅ SUCCESS: MatterCodes updated correctly in database!');
      } else {
        console.log('❌ FAILURE: MatterCodes not updated in database');
      }
      
    } catch (error) {
      console.error('❌ Error updating matterCodes:', error);
    }
  }

  // Step 3: Test the full update process like the frontend does
  console.log(`\n🎯 Step 3: Simulating Frontend Variable Editor Update`);
  
  if (americano) {
    const frontendUpdateData = {
      ...americano,
      matterCodes: 'CoffeeMatter10,CoffeeMatter11,CoffeeMatter12',
      jsonCodeVal: americano.json_code_val, // Keep existing
      // Convert database fields to frontend format
      goodsId: americano.goods_id,
      deviceGoodsId: americano.device_goods_id,
      goodsName: americano.goods_name,
      goodsNameEn: americano.goods_name_en,
      goodsNameOt: americano.goods_name_ot,
      goodsPath: americano.goods_path
    };
    
    console.log('📤 Frontend-style update data:', {
      id: frontendUpdateData.id,
      matterCodes: frontendUpdateData.matterCodes,
      jsonCodeVal: frontendUpdateData.jsonCodeVal
    });
    
    try {
      const result = db.updateProduct(americano.id, frontendUpdateData);
      console.log('✅ Frontend-style update result:', result);
      
      const finalProduct = db.getProductById(americano.id);
      console.log(`📋 Final Matter Codes: "${finalProduct.matter_codes}"`);
      
    } catch (error) {
      console.error('❌ Error with frontend-style update:', error);
    }
  }

  console.log('\n🔍 Debug Complete!');
  console.log('If this shows SUCCESS but you still can\'t update via UI,');
  console.log('the issue is likely in the frontend form or API communication.');
}

// Run the debug
debugMatterCodes().catch(console.error);
