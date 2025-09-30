const db = require('./src/database/db');

/**
 * Setup product ingredients for existing products
 * This script maps products to their ingredient requirements
 */

async function setupProductIngredients() {
  try {
    console.log('🔄 Setting up product ingredients...');
    
    // Check if inventory system is available
    if (!db.inventory) {
      console.log('❌ Inventory system not available');
      return;
    }
    
    // Get all inventory items
    const inventoryItems = db.inventory.getAllInventoryItems();
    console.log('📦 Available inventory items:', inventoryItems.map(item => `${item.name} (${item.display_name})`));
    
    // Get all products
    const products = db.getAllProducts();
    console.log('☕ Available products:', products.map(p => `${p.goods_name_en} (ID: ${p.goods_id})`));
    
    // Define ingredient mappings for common coffee products
    const productIngredientMappings = {
      // Latte products (assuming 12oz cups)
      'latte': [
        { ingredient_name: 'coffee_beans_1', quantity: 18, unit: 'grams' },
        { ingredient_name: 'milk_1', quantity: 200, unit: 'ml' },
        { ingredient_name: 'cup_12oz', quantity: 1, unit: 'cups' }
      ],
      'cappuccino': [
        { ingredient_name: 'coffee_beans_1', quantity: 18, unit: 'grams' },
        { ingredient_name: 'milk_1', quantity: 150, unit: 'ml' },
        { ingredient_name: 'cup_12oz', quantity: 1, unit: 'cups' }
      ],
      'americano': [
        { ingredient_name: 'coffee_beans_1', quantity: 18, unit: 'grams' },
        { ingredient_name: 'water', quantity: 200, unit: 'ml' },
        { ingredient_name: 'cup_12oz', quantity: 1, unit: 'cups' }
      ],
      'espresso': [
        { ingredient_name: 'coffee_beans_1', quantity: 18, unit: 'grams' },
        { ingredient_name: 'cup_8oz', quantity: 1, unit: 'cups' }
      ],
      'cortado': [
        { ingredient_name: 'coffee_beans_1', quantity: 18, unit: 'grams' },
        { ingredient_name: 'milk_1', quantity: 100, unit: 'ml' },
        { ingredient_name: 'cup_8oz', quantity: 1, unit: 'cups' }
      ]
    };
    
    let setupCount = 0;
    
    // Process each product
    for (const product of products) {
      const productName = product.goods_name_en.toLowerCase();
      console.log(`\n🔄 Processing product: ${product.goods_name_en}`);
      
      // Find matching ingredient mapping
      let ingredients = null;
      for (const [key, mapping] of Object.entries(productIngredientMappings)) {
        if (productName.includes(key)) {
          ingredients = mapping;
          break;
        }
      }
      
      if (!ingredients) {
        console.log(`⚠️ No ingredient mapping found for ${product.goods_name_en}`);
        continue;
      }
      
      // Convert ingredient names to IDs
      const productIngredients = [];
      for (const ingredient of ingredients) {
        const inventoryItem = inventoryItems.find(item => item.name === ingredient.ingredient_name);
        if (inventoryItem) {
          productIngredients.push({
            ingredient_id: inventoryItem.id,
            quantity_per_unit: ingredient.quantity,
            unit: ingredient.unit,
            is_optional: false
          });
          console.log(`  ✅ Added ${ingredient.quantity}${ingredient.unit} of ${inventoryItem.display_name}`);
        } else {
          console.log(`  ❌ Inventory item not found: ${ingredient.ingredient_name}`);
        }
      }
      
      if (productIngredients.length > 0) {
        try {
          // Set product ingredients using the database ID, not goods_id
          db.inventory.setProductIngredients(product.id, productIngredients);
          console.log(`✅ Set ${productIngredients.length} ingredients for ${product.goods_name_en}`);
          setupCount++;
        } catch (error) {
          console.error(`❌ Error setting ingredients for ${product.goods_name_en}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Setup complete! Configured ingredients for ${setupCount} products`);
    
    // Show summary
    console.log('\n📊 Product Ingredient Summary:');
    for (const product of products) {
      const ingredients = db.inventory.getProductIngredients(product.id);
      if (ingredients.length > 0) {
        console.log(`\n${product.goods_name_en}:`);
        ingredients.forEach(ing => {
          console.log(`  - ${ing.display_name}: ${ing.quantity_per_unit} ${ing.unit}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up product ingredients:', error);
  }
}

// Run the setup
setupProductIngredients().then(() => {
  console.log('\n🎉 Product ingredient setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
