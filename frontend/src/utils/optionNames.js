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
      en: 'Extra shot',
      ar: 'جرعة إضافية'
    }
  },

  // Noodle Specifications (device 2, foodType=1). Value 5 = BeefAndSoup —
  // the machine's PLC branches on that combo via a dedicated hardware bit.
  noodleSpec:   { en: 'Noodle Specification', ar: 'إضافة المعكرونة', description: { en: 'Choose your noodle add-in', ar: 'اختر الإضافة' } },
  noodleSpec_0: { en: 'Plain',                ar: 'سادة',            description: { en: 'No add-ins',                ar: 'بدون إضافات' } },
  noodleSpec_1: { en: 'Beef',                 ar: 'لحم بقري',        description: { en: 'Beef topping',              ar: 'إضافة لحم' } },
  noodleSpec_2: { en: 'Soup',                 ar: 'شوربة',           description: { en: 'Soup broth',                ar: 'مرق الشوربة' } },
  noodleSpec_3: { en: 'House Mix',            ar: 'خلطة البيت',      description: { en: 'Prefabricated mixture',     ar: 'خلطة جاهزة' } },
  noodleSpec_4: { en: 'Broccoli',             ar: 'بروكلي',          description: { en: 'Broccoli topping',          ar: 'إضافة بروكلي' } },
  noodleSpec_5: { en: 'Beef & Soup',          ar: 'لحم وشوربة',      description: { en: 'Combo — beef with soup',    ar: 'كومبو لحم مع شوربة' } }
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
