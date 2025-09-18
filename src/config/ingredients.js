/**
 * Coffee Machine Ingredient Mapping
 * Based on real coffee machine materials data
 */

const INGREDIENT_MAPPING = {
  // Real ingredient names from the coffee machine
  CoffeeMatter1: {
    name_cn: "8oz纸杯",
    name_en: "8oz Paper Cups", 
    type: "Cup",
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 20,
    criticalLevel: 5
  },
  CoffeeMatter2: {
    name_cn: "咖啡豆",
    name_en: "Coffee Beans",
    type: "Coffee", 
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  },
  CoffeeMatter3: {
    name_cn: "牛奶",
    name_en: "Milk",
    type: "Coffee",
    status: "common.normal", 
    normalLevel: 100,
    warningLevel: 20,
    criticalLevel: 10
  },
  CoffeeMatter4: {
    name_cn: "冰块",
    name_en: "Ice",
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 25,
    criticalLevel: 10
  },
  CoffeeMatter5: {
    name_cn: "咖啡机水",
    name_en: "Coffee Machine Water", 
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  },
  CoffeeMatter6: {
    name_cn: "1号杯",
    name_en: "Cup #1",
    type: "Coffee",
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 30,
    criticalLevel: 10
  },
  CoffeeMatter7: {
    name_cn: "2杯糖",
    name_en: "2 Cup Sugar",
    type: "Coffee", 
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 25,
    criticalLevel: 5
  },
  CoffeeMatter8: {
    name_cn: "3杯子",
    name_en: "3 Cups",
    type: "Coffee",
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 20,
    criticalLevel: 5
  },
  CoffeeMatter9: {
    name_cn: "打印纸张",
    name_en: "Printer Paper",
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 10,
    criticalLevel: 2
  },
  CoffeeMatter10: {
    name_cn: "12oz纸杯",
    name_en: "12oz Paper Cups",
    type: "Coffee",
    status: "common.abnormal", 
    normalLevel: 100,
    warningLevel: 20,
    criticalLevel: 5
  },
  CoffeeMatter11: {
    name_cn: "咖啡机糖浆",
    name_en: "Coffee Machine Syrup",
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  },
  CoffeeMatter12: {
    name_cn: "机器人糖浆",
    name_en: "Robot Syrup", 
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  },
  CoffeeMatter13: {
    name_cn: "咖啡豆2",
    name_en: "Coffee Beans 2",
    type: "Coffee",
    status: "common.normal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  },
  CoffeeMatter14: {
    name_cn: "牛奶2",
    name_en: "Milk 2",
    type: "Coffee", 
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 20,
    criticalLevel: 10
  },
  CoffeeMatter15: {
    name_cn: "制冰机水",
    name_en: "Ice Machine Water",
    type: "Coffee",
    status: "common.abnormal",
    normalLevel: 100,
    warningLevel: 15,
    criticalLevel: 5
  }
};

/**
 * Get ingredient display name
 */
function getIngredientName(code, language = 'en') {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return code;
  
  return language === 'cn' ? ingredient.name_cn : ingredient.name_en;
}

/**
 * Get ingredient status level 
 * Handles both percentage values (0-100) and boolean values (0/1)
 */
function getIngredientStatus(code, currentLevel) {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return 'unknown';
  
  // Convert string to number if needed
  const level = typeof currentLevel === 'string' ? parseFloat(currentLevel) : currentLevel;
  
  // Handle percentage values (0-100)
  if (level <= ingredient.criticalLevel) return 'critical';
  if (level <= ingredient.warningLevel) return 'warning';
  if (level >= ingredient.normalLevel * 0.8) return 'normal'; // 80% or above is normal
  
  // Fallback: anything above warning is normal
  return level > ingredient.warningLevel ? 'normal' : 'warning';
}

/**
 * Get all ingredients with their current status
 */
function getIngredientsWithStatus(currentLevels) {
  const result = {};
  
  for (const [code, level] of Object.entries(currentLevels)) {
    const ingredient = INGREDIENT_MAPPING[code];
    if (ingredient) {
      result[code] = {
        name_cn: ingredient.name_cn,
        name_en: ingredient.name_en,
        type: ingredient.type,
        currentLevel: level,
        status: getIngredientStatus(code, level),
        isAbnormal: ingredient.status === 'common.abnormal'
      };
    }
  }
  
  return result;
}

/**
 * Get critical ingredients (out of stock - value 0)
 */
function getCriticalIngredients(currentLevels) {
  const critical = [];
  
  for (const [code, level] of Object.entries(currentLevels)) {
    const ingredient = INGREDIENT_MAPPING[code];
    if (ingredient && (level === 0 || level === '0')) {
      critical.push({
        code,
        name_en: ingredient.name_en,
        name_cn: ingredient.name_cn,
        currentLevel: level,
        status: 'Out of Stock'
      });
    }
  }
  
  return critical;
}

/**
 * Generate realistic ingredient consumption for a recipe
 */
function consumeIngredients(currentLevels, matterCodes) {
  if (!matterCodes) return currentLevels;
  
  const updatedLevels = { ...currentLevels };
  const codes = matterCodes.split(',').map(code => code.trim());
  
  for (const code of codes) {
    if (updatedLevels[code] !== undefined) {
      // Realistic consumption: 1-5% per use
      const consumption = Math.floor(Math.random() * 5) + 1;
      updatedLevels[code] = Math.max(0, updatedLevels[code] - consumption);
    }
  }
  
  return updatedLevels;
}

module.exports = {
  INGREDIENT_MAPPING,
  getIngredientName,
  getIngredientStatus,
  getIngredientsWithStatus,
  getCriticalIngredients,
  consumeIngredients
};
