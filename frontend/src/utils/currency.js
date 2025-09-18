// Frontend Currency Configuration Utility
// Centralizes currency formatting and display for React components

class CurrencyUtils {
  constructor() {
    // Get currency settings from environment variables
    this.CURRENCY_CODE = process.env.REACT_APP_CURRENCY_CODE || 'AED';
    this.CURRENCY_SYMBOL = process.env.REACT_APP_CURRENCY_SYMBOL || 'د.إ';
    this.CURRENCY_NAME = process.env.REACT_APP_CURRENCY_NAME || 'UAE Dirham';
    this.CURRENCY_POSITION = process.env.REACT_APP_CURRENCY_POSITION || 'before';
    this.DECIMAL_PLACES = parseInt(process.env.REACT_APP_DECIMAL_PLACES) || 2;
  }
  
  // Format price for display
  formatPrice(amount, options = {}) {
    const {
      symbol = this.CURRENCY_SYMBOL,
      position = this.CURRENCY_POSITION,
      decimals = this.DECIMAL_PLACES,
      showSymbol = true
    } = options;
    
    // Handle null/undefined amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showSymbol ? `${symbol}0.${'0'.repeat(decimals)}` : `0.${'0'.repeat(decimals)}`;
    }
    
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
  }
  
  // Format price with localized symbol
  formatPriceLocalized(amount, language = 'en') {
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
    
    const localizedSymbol = symbols[this.CURRENCY_CODE]?.[language] || this.CURRENCY_SYMBOL;
    return this.formatPrice(amount, { symbol: localizedSymbol });
  }
  
  // Get currency symbol for current configuration
  getSymbol() {
    return this.CURRENCY_SYMBOL;
  }
  
  // Get currency code for current configuration
  getCode() {
    return this.CURRENCY_CODE;
  }
  
  // Get currency name for current configuration
  getName() {
    return this.CURRENCY_NAME;
  }
  
  // Parse string price to number (removes currency symbols)
  parsePrice(priceString) {
    if (typeof priceString === 'number') {
      return priceString;
    }
    
    // Remove currency symbols and parse as float
    const cleanString = priceString
      .replace(/[^\d.-]/g, '') // Remove all non-digit, non-decimal, non-minus characters
      .trim();
    
    return parseFloat(cleanString) || 0;
  }
  
  // Calculate totals with proper decimal handling
  calculateTotal(items) {
    return items.reduce((total, item) => {
      const price = this.parsePrice(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return total + (price * quantity);
    }, 0);
  }
  
  // Format for API submission (usually just the number)
  formatForAPI(amount) {
    return parseFloat(amount).toFixed(this.DECIMAL_PLACES);
  }
  
  // Currency configuration info
  getConfig() {
    return {
      code: this.CURRENCY_CODE,
      symbol: this.CURRENCY_SYMBOL,
      name: this.CURRENCY_NAME,
      position: this.CURRENCY_POSITION,
      decimals: this.DECIMAL_PLACES
    };
  }
}

// Create singleton instance
const currencyUtils = new CurrencyUtils();

// Export both the class and instance for flexibility
export { CurrencyUtils };
export default currencyUtils;

