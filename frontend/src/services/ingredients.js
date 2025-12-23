/**
 * Machine Ingredients Service
 * Shared ingredient mapping and utilities for the frontend
 * Supports Coffee (CoffeeMatter*) and Ice Cream (IceMatter*) machines
 */

// Real coffee machine ingredients mapping (matches backend)
export const INGREDIENT_MAPPING = {
  'CoffeeMatter1': { 
    name: '8oz Paper Cups', 
    name_cn: '8oz纸杯', 
    type: 'Cups',
    warningLevel: 20,
    criticalLevel: 5
  },
  'CoffeeMatter2': { 
    name: 'Coffee Beans', 
    name_cn: '咖啡豆', 
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },
  'CoffeeMatter3': { 
    name: 'Milk', 
    name_cn: '牛奶', 
    type: 'Coffee',
    warningLevel: 20,
    criticalLevel: 10
  },
  'CoffeeMatter4': { 
    name: 'Ice', 
    name_cn: '冰块', 
    type: 'Coffee',
    warningLevel: 25,
    criticalLevel: 10
  },
  'CoffeeMatter5': { 
    name: 'Coffee Machine Water', 
    name_cn: '咖啡机水', 
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },
  'CoffeeMatter6': { 
    name: 'Cup #1', 
    name_cn: '1号杯', 
    type: 'Cups',
    warningLevel: 30,
    criticalLevel: 10
  },
  'CoffeeMatter7': { 
    name: '2 Cup Sugar', 
    name_cn: '2杯糖', 
    type: 'Coffee',
    warningLevel: 25,
    criticalLevel: 5
  },
  'CoffeeMatter8': { 
    name: '3 Cups', 
    name_cn: '3杯子', 
    type: 'Cups',
    warningLevel: 20,
    criticalLevel: 5
  },
  'CoffeeMatter9': { 
    name: 'Printer Paper', 
    name_cn: '打印纸张', 
    type: 'Supplies',
    warningLevel: 10,
    criticalLevel: 2
  },
  'CoffeeMatter10': { 
    name: '12oz Paper Cups', 
    name_cn: '12oz纸杯', 
    type: 'Cups',
    warningLevel: 20,
    criticalLevel: 5
  },
  'CoffeeMatter11': { 
    name: 'Coffee Machine Syrup', 
    name_cn: '咖啡机糖浆', 
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },
  'CoffeeMatter12': { 
    name: 'Robot Syrup', 
    name_cn: '机器人糖浆', 
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },
  'CoffeeMatter13': { 
    name: 'Coffee Beans 2', 
    name_cn: '咖啡豆2', 
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },
  'CoffeeMatter14': { 
    name: 'Milk 2', 
    name_cn: '牛奶2', 
    type: 'Coffee',
    warningLevel: 20,
    criticalLevel: 10
  },
  'CoffeeMatter15': {
    name: 'Ice Machine Water',
    name_cn: '制冰机水',
    type: 'Coffee',
    warningLevel: 15,
    criticalLevel: 5
  },

  // Ice Cream Machine Ingredients (type=3, device=4)
  // Placeholder names - configurable via frontend option names
  'IceMatter6': {
    name: 'Ice Code 6',
    name_cn: '冰淇淋代码6',
    type: 'IceCream',
    warningLevel: 20,
    criticalLevel: 5
  },
  'IceMatter7': {
    name: 'Ice Code 7',
    name_cn: '冰淇淋代码7',
    type: 'IceCream',
    warningLevel: 20,
    criticalLevel: 5
  },
  'IceMatter8': {
    name: 'Ice Code 8',
    name_cn: '冰淇淋代码8',
    type: 'IceCream',
    warningLevel: 20,
    criticalLevel: 5
  },
  'IceMatter9': {
    name: 'Ice Code 9',
    name_cn: '冰淇淋代码9',
    type: 'IceCream',
    warningLevel: 20,
    criticalLevel: 5
  },
  'IceMatter10': {
    name: 'Ice Code 10',
    name_cn: '冰淇淋代码10',
    type: 'IceCream',
    warningLevel: 20,
    criticalLevel: 5
  }
};

/**
 * Get ingredient display name
 */
export const getIngredientName = (code, language = 'en') => {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return code;
  
  return language === 'cn' ? ingredient.name_cn : ingredient.name;
};

/**
 * Get ingredient display name with both languages
 */
export const getIngredientFullName = (code) => {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return code;
  
  return `${ingredient.name} (${ingredient.name_cn})`;
};

/**
 * Get ingredient status based on level
 * Coffee machine sends 0/1 values directly, not percentages
 */
export const getIngredientStatus = (code, currentLevel) => {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return 'unknown';
  
  const level = typeof currentLevel === 'string' ? parseFloat(currentLevel) : currentLevel;
  
  // Coffee machine sends direct boolean values (0 or 1)
  // For boolean values, use direct mapping
  if (level === 0) return 'error';   // 0 = OUT OF STOCK = red/critical
  if (level === 1) return 'ok';      // 1 = IN STOCK = green/available
  
  // For percentage values (fallback for mock data), use thresholds
  if (level <= ingredient.criticalLevel) return 'error';
  if (level <= ingredient.warningLevel) return 'warning';
  return 'ok';
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'ok': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'error': return '#EF4444';
    default: return '#6B7280';
  }
};

/**
 * Get status text
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'ok': return 'Available';
    case 'warning': return 'Low';
    case 'error': return 'Critical';
    default: return 'Unknown';
  }
};

/**
 * Convert coffee machine level to boolean (1 = available, 0 = unavailable)
 * Coffee machine sends 0/1 values directly, not percentages
 */
export const getIngredientBoolean = (code, currentLevel) => {
  const ingredient = INGREDIENT_MAPPING[code];
  if (!ingredient) return 0;
  
  const level = typeof currentLevel === 'string' ? parseFloat(currentLevel) : currentLevel;
  
  // Coffee machine sends direct boolean values (0 or 1)
  // For boolean values, return them directly
  if (level === 0 || level === 1) {
    return level;
  }
  
  // For percentage values (fallback for mock data), use warning threshold
  return level > ingredient.warningLevel ? 1 : 0;
};

/**
 * Get simple boolean status text (Available/Unavailable)
 */
export const getBooleanStatusText = (code, currentLevel) => {
  return getIngredientBoolean(code, currentLevel) === 1 ? 'AVAILABLE' : 'UNAVAILABLE';
};

/**
 * Format ingredient list for display
 */
export const formatIngredientList = (matterCodes) => {
  if (!matterCodes) return [];
  
  return matterCodes.split(',').map(code => {
    const trimmed = code.trim();
    const ingredient = INGREDIENT_MAPPING[trimmed];
    return {
      code: trimmed,
      name: ingredient ? ingredient.name : trimmed,
      name_cn: ingredient ? ingredient.name_cn : trimmed,
      fullName: ingredient ? `${ingredient.name} (${ingredient.name_cn})` : trimmed
    };
  });
};

/**
 * Get ingredients by type
 */
export const getIngredientsByType = (type) => {
  return Object.entries(INGREDIENT_MAPPING)
    .filter(([code, ingredient]) => ingredient.type === type)
    .map(([code, ingredient]) => ({
      code,
      ...ingredient
    }));
};

/**
 * Get all ingredient types
 */
export const getIngredientTypes = () => {
  const types = new Set();
  Object.values(INGREDIENT_MAPPING).forEach(ingredient => {
    types.add(ingredient.type);
  });
  return Array.from(types);
};
