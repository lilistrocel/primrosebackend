// Currency Configuration Module
// Centralizes all currency settings for easy updates

require('dotenv').config();

const currencyConfig = {
  // Currency settings from environment variables or defaults
  CURRENCY_CODE: process.env.CURRENCY_CODE || 'AED',
  CURRENCY_SYMBOL: process.env.CURRENCY_SYMBOL || 'د.إ',
  CURRENCY_NAME: process.env.CURRENCY_NAME || 'UAE Dirham',
  CURRENCY_POSITION: process.env.CURRENCY_POSITION || 'before', // 'before' or 'after'
  DECIMAL_PLACES: parseInt(process.env.DECIMAL_PLACES) || 2,
  
  // Currency formatting options
  formatPrice(amount, options = {}) {
    const {
      symbol = this.CURRENCY_SYMBOL,
      position = this.CURRENCY_POSITION,
      decimals = this.DECIMAL_PLACES,
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
  },
  
  // Convert from USD to configured currency (placeholder for future exchange rate integration)
  convertFromUSD(usdAmount, exchangeRate = null) {
    const rate = exchangeRate || this.getExchangeRate();
    return parseFloat((parseFloat(usdAmount) * rate).toFixed(this.DECIMAL_PLACES));
  },
  
  // Get exchange rate (placeholder - can be connected to real-time API later)
  getExchangeRate() {
    const rates = {
      'AED': 3.67,  // 1 USD = 3.67 AED (approximate)
      'USD': 1.00,
      'EUR': 0.85,
      'GBP': 0.73,
      'SAR': 3.75   // Saudi Riyal
    };
    
    return rates[this.CURRENCY_CODE] || 1.00;
  },
  
  // Currency display configuration for different languages
  getLocalizedSymbol(language = 'en') {
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
    
    return symbols[this.CURRENCY_CODE]?.[language] || this.CURRENCY_SYMBOL;
  },
  
  // Get currency name in different languages
  getLocalizedName(language = 'en') {
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
    
    return names[this.CURRENCY_CODE]?.[language] || this.CURRENCY_NAME;
  },
  
  // Display current configuration
  display() {
    console.log('💰 Currency Configuration:');
    console.log(`   Code: ${this.CURRENCY_CODE}`);
    console.log(`   Symbol: ${this.CURRENCY_SYMBOL}`);
    console.log(`   Name: ${this.CURRENCY_NAME}`);
    console.log(`   Position: ${this.CURRENCY_POSITION}`);
    console.log(`   Decimal Places: ${this.DECIMAL_PLACES}`);
    console.log(`   Exchange Rate (from USD): ${this.getExchangeRate()}`);
    console.log('');
    console.log('🌍 Localized Display:');
    console.log(`   English: ${this.getLocalizedSymbol('en')} (${this.getLocalizedName('en')})`);
    console.log(`   Arabic: ${this.getLocalizedSymbol('ar')} (${this.getLocalizedName('ar')})`);
    console.log(`   Chinese: ${this.getLocalizedSymbol('zh')} (${this.getLocalizedName('zh')})`);
    console.log('');
    console.log('💡 Example Formatting:');
    console.log(`   ${this.formatPrice(25.50)} (${this.getLocalizedName('en')})`);
    console.log(`   ${this.formatPrice(25.50, { symbol: this.getLocalizedSymbol('ar') })} (${this.getLocalizedName('ar')})`);
    console.log('');
    console.log('📝 To change currency:');
    console.log('   1. Edit .env file in project root');
    console.log('   2. Update CURRENCY_CODE, CURRENCY_SYMBOL, etc.');
    console.log('   3. Run: npm run currency:update');
    console.log('   4. Restart backend and frontend');
  }
};

module.exports = currencyConfig;

