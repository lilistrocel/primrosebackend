#!/usr/bin/env node

/**
 * Alert Checker CLI
 * Run this script to check for missing alerts and create them
 * 
 * Usage:
 *   node check-alerts.js                    # Check and create missing alerts
 *   node check-alerts.js --show            # Show current alerts
 *   node check-alerts.js --resolve-all     # Resolve all alerts
 */

const AlertChecker = require('./src/utils/alert-checker');

async function main() {
  const args = process.argv.slice(2);
  const showOnly = args.includes('--show');
  const resolveAll = args.includes('--resolve-all');
  
  try {
    const alertChecker = new AlertChecker();
    
    if (resolveAll) {
      console.log('🔄 Resolving all active alerts...');
      const resolvedCount = alertChecker.resolveAllAlerts();
      console.log(`✅ Resolved ${resolvedCount} alerts`);
      return;
    }
    
    if (showOnly) {
      console.log('📋 Current Active Alerts:');
      const alerts = alertChecker.getActiveAlerts();
      
      if (alerts.length === 0) {
        console.log('   ✅ No active alerts');
      } else {
        alerts.forEach((alert, index) => {
          console.log(`   ${index + 1}. ${alert.display_name}: ${alert.message}`);
          console.log(`      Type: ${alert.alert_type}, Created: ${alert.created_at}`);
        });
      }
      return;
    }
    
    // Check and create missing alerts
    const result = await alertChecker.checkAllAlerts();
    
    // Show current alerts
    console.log(`\n🚨 CURRENT ACTIVE ALERTS:`);
    const alerts = alertChecker.getActiveAlerts();
    
    if (alerts.length === 0) {
      console.log(`   ✅ No active alerts`);
    } else {
      alerts.forEach((alert, index) => {
        console.log(`   🚨 ${alert.display_name}: ${alert.message} (${alert.alert_type})`);
      });
    }
    
    console.log(`\n✅ Alert check completed successfully!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
