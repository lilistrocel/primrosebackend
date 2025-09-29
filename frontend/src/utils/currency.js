// Currency utility for frontend
// Fetches currency configuration from backend and provides formatting functions

let currencyConfig = null;

// Fetch currency configuration from backend
export const loadCurrencyConfig = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/motong/currency-config`);
    if (response.ok) {
      const data = await response.json();
      currencyConfig = data.data;
    }
  } catch (error) {
    console.warn('Failed to load currency config, using defaults:', error);
    // Use default currency configuration
    currencyConfig = {
      CURRENCY_CODE: 'AED',
      CURRENCY_SYMBOL: 'د.إ',
      CURRENCY_NAME: 'UAE Dirham',
      CURRENCY_POSITION: 'before',
      DECIMAL_PLACES: 2
    };
  }
};

// Format price with current currency settings
export const formatPrice = (amount, options = {}) => {
  if (!currencyConfig) {
    // Fallback to default formatting
    return `$${parseFloat(amount).toFixed(2)}`;
  }

  const {
    symbol = currencyConfig.CURRENCY_SYMBOL,
    position = currencyConfig.CURRENCY_POSITION,
    decimals = currencyConfig.DECIMAL_PLACES,
    showSymbol = true
  } = options;
  
  // Convert to number and fix decimals
  const numAmount = parseFloat(amount);
  const formattedNumber = numAmount.toFixed(decimals);
  
  if (!showSymbol) {
    return formattedNumber;
  }
  
  // Return formatted currency based on position
  if (position === 'before') {
    return `${symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${symbol}`;
  }
};

// Get localized currency symbol for current language
export const getCurrencySymbol = (language = 'en') => {
  if (!currencyConfig) {
    return language === 'ar' ? 'د.إ' : '$';
  }

  const symbols = {
    'AED': {
      'en': 'AED',
      'ar': 'د.إ',
      'zh': '迪拉姆'
    },
    'USD': {
      'en': '$',
      'ar': '$',
      'zh': '$'
    },
    'EUR': {
      'en': '€',
      'ar': '€',
      'zh': '€'
    },
    'SAR': {
      'en': 'SAR',
      'ar': 'ر.س',
      'zh': '里亚尔'
    }
  };
  
  return symbols[currencyConfig.CURRENCY_CODE]?.[language] || currencyConfig.CURRENCY_SYMBOL;
};

// Get currency name in different languages
export const getCurrencyName = (language = 'en') => {
  if (!currencyConfig) {
    return language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham';
  }

  const names = {
    'AED': {
      'en': 'UAE Dirham',
      'ar': 'درهم إماراتي',
      'zh': '阿联酋迪拉姆'
    },
    'USD': {
      'en': 'US Dollar',
      'ar': 'دولار أمريكي',
      'zh': '美元'
    },
    'EUR': {
      'en': 'Euro',
      'ar': 'يورو',
      'zh': '欧元'
    },
    'SAR': {
      'en': 'Saudi Riyal',
      'ar': 'ريال سعودي',
      'zh': '沙特里亚尔'
    }
  };
  
  return names[currencyConfig.CURRENCY_CODE]?.[language] || currencyConfig.CURRENCY_NAME;
};

// Initialize currency configuration
export const initCurrency = async () => {
  await loadCurrencyConfig();
};