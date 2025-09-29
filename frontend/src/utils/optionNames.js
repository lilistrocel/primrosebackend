// Configurable option names for customization modal
// This allows admins to customize the names of options like "Bean Type 1", "Milk Type", etc.

export const defaultOptionNames = {
  // Bean Types
  beanType1: {
    en: 'Bean Type 1',
    ar: 'نوع الحبوب 1',
    description: {
      en: 'House Blend',
      ar: 'مزيج البيت'
    }
  },
  beanType2: {
    en: 'Bean Type 2', 
    ar: 'نوع الحبوب 2',
    description: {
      en: 'Premium Roast',
      ar: 'تحميص مميز'
    }
  },
  
  // Milk Types
  milkType1: {
    en: 'Regular Milk',
    ar: 'حليب عادي',
    description: {
      en: 'Whole milk',
      ar: 'حليب كامل'
    }
  },
  milkType2: {
    en: 'Oat Milk',
    ar: 'حليب الشوفان',
    description: {
      en: 'Plant-based',
      ar: 'نباتي'
    }
  },
  
  // Ice Options
  withIce: {
    en: 'With Ice',
    ar: 'مع ثلج',
    description: {
      en: 'Regular ice',
      ar: 'ثلج عادي'
    }
  },
  noIce: {
    en: 'No Ice',
    ar: 'بدون ثلج',
    description: {
      en: 'Hot beverage',
      ar: 'مشروب ساخن'
    }
  },
  
  // Shot Options
  singleShot: {
    en: 'Single Shot',
    ar: 'جرعة واحدة',
    description: {
      en: 'Regular strength',
      ar: 'قوة عادية'
    }
  },
  doubleShot: {
    en: 'Double Shot',
    ar: 'جرعتان',
    description: {
      en: '+$0.50',
      ar: '+$0.50'
    }
  }
};

// Function to get option name based on current language
export const getOptionName = (optionKey, language = 'en') => {
  const option = defaultOptionNames[optionKey];
  if (!option) return optionKey;
  return option[language] || option.en;
};

// Function to get option description based on current language
export const getOptionDescription = (optionKey, language = 'en') => {
  const option = defaultOptionNames[optionKey];
  if (!option) return '';
  return option.description[language] || option.description.en;
};

// Function to get all option names for a specific language
export const getAllOptionNames = (language = 'en') => {
  const result = {};
  Object.keys(defaultOptionNames).forEach(key => {
    result[key] = {
      name: getOptionName(key, language),
      description: getOptionDescription(key, language)
    };
  });
  return result;
};
