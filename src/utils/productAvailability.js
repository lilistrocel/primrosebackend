/**
 * Product Availability Checker
 * Determines if products can be sold based on ingredient availability
 */

const { INGREDIENT_MAPPING, getIngredientStatus } = require('../config/ingredients');

/**
 * Check if a product is available based on its required ingredients
 * @param {string} matterCodes - Comma-separated ingredient codes (e.g., "CoffeeMatter1,CoffeeMatter2")
 * @param {object} currentIngredientLevels - Current ingredient levels from device status
 * @returns {object} - { available: boolean, missingIngredients: array, reason: string }
 */
function checkProductAvailability(matterCodes, currentIngredientLevels) {
  // If no matter codes specified, product is always available
  if (!matterCodes || matterCodes.trim() === '') {
    return {
      available: true,
      missingIngredients: [],
      reason: 'No ingredients required'
    };
  }

  // Parse matter codes
  const requiredIngredients = matterCodes.split(',').map(code => code.trim()).filter(code => code);
  const missingIngredients = [];
  
  console.log(`🔍 Checking availability for matterCodes: ${matterCodes}`);
  console.log(`📋 Required ingredients: ${requiredIngredients.join(', ')}`);
  
  // Check each required ingredient
  for (const ingredientCode of requiredIngredients) {
    const currentLevel = currentIngredientLevels[ingredientCode];
    const status = getIngredientStatus(ingredientCode, currentLevel);
    
    console.log(`  ${ingredientCode}: level=${currentLevel}, status=${status}`);
    
    // If ingredient is critical (0) or missing, product is not available
    if (status === 'critical' || currentLevel === 0 || currentLevel === '0' || currentLevel === undefined) {
      const ingredient = INGREDIENT_MAPPING[ingredientCode];
      missingIngredients.push({
        code: ingredientCode,
        name: ingredient ? ingredient.name_en : ingredientCode,
        level: currentLevel,
        status: status
      });
    }
  }
  
  const available = missingIngredients.length === 0;
  const reason = available 
    ? 'All ingredients available'
    : `Missing ingredients: ${missingIngredients.map(ing => ing.name).join(', ')}`;
    
  console.log(`✅ Product availability: ${available ? 'AVAILABLE' : 'NOT AVAILABLE'} (${reason})`);
  
  return {
    available,
    missingIngredients,
    reason
  };
}

/**
 * Check availability for multiple products
 * @param {array} products - Array of product objects with matterCodes
 * @param {object} currentIngredientLevels - Current ingredient levels
 * @returns {object} - Map of productId -> availability info
 */
function checkMultipleProductsAvailability(products, currentIngredientLevels) {
  const availabilityMap = {};
  
  console.log(`🔍 Checking availability for ${products.length} products`);
  
  for (const product of products) {
    const productId = product.goodsId || product.id;
    const availability = checkProductAvailability(product.matterCodes, currentIngredientLevels);
    
    availabilityMap[productId] = {
      ...availability,
      productName: product.goodsNameEn || product.goodsName,
      matterCodes: product.matterCodes
    };
  }
  
  const availableCount = Object.values(availabilityMap).filter(a => a.available).length;
  const unavailableCount = products.length - availableCount;
  
  console.log(`📊 Availability Summary: ${availableCount} available, ${unavailableCount} unavailable`);
  
  return availabilityMap;
}

/**
 * Get current ingredient levels from latest device status
 * @param {object} db - Database instance
 * @returns {object} - Current ingredient levels or empty object if no data
 */
function getCurrentIngredientLevels(db) {
  try {
    const deviceStatus = db.getLatestDeviceStatus(1); // Device ID 1
    
    if (!deviceStatus || !deviceStatus.matter_status_json) {
      console.log('⚠️ No device status found, assuming all ingredients available');
      return {};
    }
    
    const ingredientLevels = JSON.parse(deviceStatus.matter_status_json);
    console.log('📊 Current ingredient levels:', ingredientLevels);
    
    return ingredientLevels;
  } catch (error) {
    console.error('❌ Error getting ingredient levels:', error);
    return {}; // Return empty object on error - assume all available
  }
}

/**
 * Get availability summary for dashboard/monitoring
 * @param {object} availabilityMap - Result from checkMultipleProductsAvailability
 * @returns {object} - Summary statistics
 */
function getAvailabilitySummary(availabilityMap) {
  const total = Object.keys(availabilityMap).length;
  const available = Object.values(availabilityMap).filter(a => a.available).length;
  const unavailable = total - available;
  
  // Get most common missing ingredients
  const missingIngredients = {};
  Object.values(availabilityMap).forEach(product => {
    if (!product.available) {
      product.missingIngredients.forEach(ingredient => {
        missingIngredients[ingredient.code] = (missingIngredients[ingredient.code] || 0) + 1;
      });
    }
  });
  
  return {
    total,
    available,
    unavailable,
    availabilityRate: total > 0 ? (available / total * 100).toFixed(1) : 100,
    mostCommonMissingIngredients: Object.entries(missingIngredients)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, affectedProducts: count }))
  };
}

module.exports = {
  checkProductAvailability,
  checkMultipleProductsAvailability,
  getCurrentIngredientLevels,
  getAvailabilitySummary
};
