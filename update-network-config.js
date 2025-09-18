#!/usr/bin/env node

/**
 * Network Configuration Updater
 * 
 * This script helps update IP addresses across the entire project.
 * Run this script whenever you need to change the network configuration.
 * 
 * Usage:
 *   node update-network-config.js [new-ip-address]
 *   
 * Examples:
 *   node update-network-config.js 192.168.1.100
 *   node update-network-config.js 10.0.0.50
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const newIP = args[0];

// Default values
const DEFAULT_IP = '192.168.10.2';
const FRONTEND_PORT = 3001;
const BACKEND_PORT = 3000;
const MOCK_PORT = 3002;

function updateRootEnv(ip) {
  const envContent = `# Network Configuration
# Change these IP addresses as needed for your network setup
LOCAL_IP=${ip}
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}
MOCK_PORT=${MOCK_PORT}

# Frontend Configuration
REACT_APP_API_BASE_URL=http://${ip}:${BACKEND_PORT}

# Backend Configuration  
NODE_ENV=development
HOST=0.0.0.0
`;

  fs.writeFileSync('.env', envContent, 'utf8');
  console.log(`✅ Updated root .env file with IP: ${ip}`);
}

function updateFrontendEnv(ip) {
  const frontendEnvPath = path.join('frontend', '.env');
  
  const envContent = `# Network Configuration - Edit the root .env file to change IP address
HOST=0.0.0.0
PORT=${FRONTEND_PORT}
REACT_APP_API_BASE_URL=http://${ip}:${BACKEND_PORT}
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true

# To change the IP address:
# 1. Run: node update-network-config.js your.new.ip.address
# 2. Or edit the root .env file manually
# 3. Restart both frontend and backend
`;

  try {
    fs.writeFileSync(frontendEnvPath, envContent, 'utf8');
    console.log(`✅ Updated frontend/.env file with IP: ${ip}`);
  } catch (error) {
    console.log(`⚠️  Could not update frontend/.env file: ${error.message}`);
    console.log(`   Please manually update REACT_APP_API_BASE_URL=http://${ip}:${BACKEND_PORT}`);
  }
}

function displayCurrentConfig() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const ipMatch = envContent.match(/LOCAL_IP=(.+)/);
    const currentIP = ipMatch ? ipMatch[1] : DEFAULT_IP;
    
    console.log('🔧 Current Network Configuration:');
    console.log(`   Local IP: ${currentIP}`);
    console.log(`   Backend: http://${currentIP}:${BACKEND_PORT}`);
    console.log(`   Frontend: http://${currentIP}:${FRONTEND_PORT}`);
    console.log(`   Mock Machine: http://${currentIP}:${MOCK_PORT}`);
    console.log('');
    return currentIP;
  } catch (error) {
    console.log('⚠️  No .env file found, using defaults');
    return DEFAULT_IP;
  }
}

function showUsage() {
  console.log('');
  console.log('📝 Network Configuration Updater');
  console.log('');
  console.log('Usage:');
  console.log('  node update-network-config.js [new-ip-address]');
  console.log('');
  console.log('Examples:');
  console.log('  node update-network-config.js 192.168.1.100');
  console.log('  node update-network-config.js 10.0.0.50');
  console.log('');
  console.log('Steps after updating:');
  console.log('  1. Restart backend: npm start');
  console.log('  2. Restart frontend: cd frontend && npm start');
  console.log('  3. Test access from external device');
  console.log('');
}

// Main execution
console.log('🌐 Network Configuration Manager');
console.log('================================');

if (newIP) {
  // Validate IP address format (basic)
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (!ipRegex.test(newIP)) {
    console.error('❌ Invalid IP address format. Please use format: xxx.xxx.xxx.xxx');
    process.exit(1);
  }
  
  console.log(`🔄 Updating network configuration to: ${newIP}`);
  updateRootEnv(newIP);
  updateFrontendEnv(newIP);
  
  console.log('');
  console.log('✅ Network configuration updated successfully!');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   1. Restart backend: npm start');
  console.log('   2. Restart frontend: cd frontend && npm start');
  console.log(`   3. Test kiosk: http://${newIP}:${FRONTEND_PORT}/kiosk`);
  console.log(`   4. Test from external device: http://${newIP}:${FRONTEND_PORT}`);
  
} else {
  const currentIP = displayCurrentConfig();
  showUsage();
  
  console.log('💡 To change IP address, run:');
  console.log(`   node update-network-config.js YOUR_NEW_IP`);
  console.log('');
}

process.exit(0);
