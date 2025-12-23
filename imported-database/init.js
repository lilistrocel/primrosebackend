#!/usr/bin/env node
/**
 * Database initialization script
 * Runs the database setup and populates with mock data
 */

const MockDataGenerator = require('./mock-data');

async function initializeDatabase() {
  console.log('🚀 Initializing Coffee Machine Database...');
  
  try {
    // Database connection and schema are handled in db.js constructor
    console.log('✅ Database schema created successfully');
    
    // Insert mock data
    MockDataGenerator.insertMockData();
    
    console.log('🎉 Database initialization completed!');
    console.log('');
    console.log('📊 Database contents:');
    console.log('  - 2 sample orders (1 queuing, 1 processing)');
    console.log('  - 2 coffee items (Espresso, Cappuccino)');
    console.log('  - Device status with ingredient levels');
    console.log('');
    console.log('🔥 Ready to start the backend server!');
    console.log('   Run: npm start');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
