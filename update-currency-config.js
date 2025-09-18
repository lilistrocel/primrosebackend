#!/usr/bin/env node

/**
 * Currency Configuration Updater
 * 
 * This script helps update currency settings across the entire project.
 * Run this script whenever you need to change the currency configuration.
 * 
 * Usage:
 *   node update-currency-config.js [currency-code]
 *   
 * Examples:
 *   node update-currency-config.js AED
 *   node update-currency-config.js USD
 *   node update-currency-config.js SAR
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const newCurrency = args[0];

// Predefined currency configurations
const currencyConfigs = {
  'AED': {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    position: 'before',
    decimals: 2
  },
  'USD': {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    position: 'before',
    decimals: 2
  },
  'SAR': {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    position: 'before',
    decimals: 2
  },
  'EUR': {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    position: 'before',
    decimals: 2
  },
  'GBP': {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    position: 'before',
    decimals: 2
  }
};

function updateRootEnv(currencyConfig) {
  const envContent = `# Network Configuration
# Change these IP addresses as needed for your network setup
LOCAL_IP=192.168.10.2
FRONTEND_PORT=3001
BACKEND_PORT=3000
MOCK_PORT=3002

# Frontend Configuration
REACT_APP_API_BASE_URL=http://192.168.10.2:3000

# Backend Configuration
NODE_ENV=development
HOST=0.0.0.0

# Currency Configuration
CURRENCY_CODE=${currencyConfig.code}
CURRENCY_SYMBOL=${currencyConfig.symbol}
CURRENCY_NAME=${currencyConfig.name}
CURRENCY_POSITION=${currencyConfig.position}
DECIMAL_PLACES=${currencyConfig.decimals}
`;

  fs.writeFileSync('.env', envContent, 'utf8');
  console.log(`✅ Updated root .env file with currency: ${currencyConfig.name} (${currencyConfig.code})`);
}

function updateFrontendEnv(currencyConfig) {
  const frontendEnvPath = path.join('frontend', '.env');
  
  const envContent = `# Network Configuration - Edit the root .env file to change IP address
HOST=0.0.0.0
PORT=3001
REACT_APP_API_BASE_URL=http://192.168.10.2:3000
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true

# Currency Configuration - Synced with backend
REACT_APP_CURRENCY_CODE=${currencyConfig.code}
REACT_APP_CURRENCY_SYMBOL=${currencyConfig.symbol}
REACT_APP_CURRENCY_NAME=${currencyConfig.name}
REACT_APP_CURRENCY_POSITION=${currencyConfig.position}
REACT_APP_DECIMAL_PLACES=${currencyConfig.decimals}

# To change currency or IP address:
# 1. Edit the root .env file or use: npm run currency:update CURRENCY_CODE
# 2. Run: npm run network:update NEW_IP (for IP changes)
# 3. Restart both frontend and backend
`;

  try {
    fs.writeFileSync(frontendEnvPath, envContent, 'utf8');
    console.log(`✅ Updated frontend/.env file with currency: ${currencyConfig.name}`);
  } catch (error) {
    console.log(`⚠️  Could not update frontend/.env file: ${error.message}`);
    console.log(`   Please manually update the frontend environment variables`);
  }
}

function displayCurrentConfig() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const codeMatch = envContent.match(/CURRENCY_CODE=(.+)/);
    const symbolMatch = envContent.match(/CURRENCY_SYMBOL=(.+)/);
    const nameMatch = envContent.match(/CURRENCY_NAME=(.+)/);
    
    const currentCode = codeMatch ? codeMatch[1] : 'AED';
    const currentSymbol = symbolMatch ? symbolMatch[1] : 'د.إ';
    const currentName = nameMatch ? nameMatch[1] : 'UAE Dirham';
    
    console.log('💰 Current Currency Configuration:');
    console.log(`   Code: ${currentCode}`);
    console.log(`   Symbol: ${currentSymbol}`);
    console.log(`   Name: ${currentName}`);
    console.log('');
    return { code: currentCode, symbol: currentSymbol, name: currentName };
  } catch (error) {
    console.log('⚠️  No .env file found, using defaults');
    return currencyConfigs.AED;
  }
}

function showUsage() {
  console.log('');
  console.log('💰 Currency Configuration Updater');
  console.log('');
  console.log('Usage:');
  console.log('  node update-currency-config.js [currency-code]');
  console.log('');
  console.log('Available Currencies:');
  Object.keys(currencyConfigs).forEach(code => {
    const config = currencyConfigs[code];
    console.log(`  ${code.padEnd(4)} - ${config.symbol} ${config.name}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node update-currency-config.js AED    # UAE Dirham');
  console.log('  node update-currency-config.js USD    # US Dollar');
  console.log('  node update-currency-config.js SAR    # Saudi Riyal');
  console.log('');
  console.log('Steps after updating:');
  console.log('  1. Restart backend: npm start');
  console.log('  2. Restart frontend: cd frontend && npm start');
  console.log('  3. Test currency display in kiosk and admin');
  console.log('');
}

// Main execution
console.log('💰 Currency Configuration Manager');
console.log('=================================');

if (newCurrency) {
  const upperCurrency = newCurrency.toUpperCase();
  
  if (!currencyConfigs[upperCurrency]) {
    console.error(`❌ Unknown currency: ${newCurrency}`);
    console.log('Available currencies:', Object.keys(currencyConfigs).join(', '));
    process.exit(1);
  }
  
  const currencyConfig = currencyConfigs[upperCurrency];
  console.log(`🔄 Updating currency configuration to: ${currencyConfig.name} (${currencyConfig.code})`);
  
  updateRootEnv(currencyConfig);
  updateFrontendEnv(currencyConfig);
  
  console.log('');
  console.log('✅ Currency configuration updated successfully!');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   1. Restart backend: npm start');
  console.log('   2. Restart frontend: cd frontend && npm start');
  console.log(`   3. Test kiosk: prices should display as ${currencyConfig.symbol}X.XX`);
  console.log(`   4. Verify admin interface shows ${currencyConfig.name} formatting`);
  
} else {
  const currentConfig = displayCurrentConfig();
  showUsage();
  
  console.log('💡 To change currency, run:');
  console.log(`   node update-currency-config.js CURRENCY_CODE`);
  console.log('');
}

process.exit(0);

