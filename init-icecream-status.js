/**
 * Initialize Ice Cream Machine Status
 * Run this once to add device_status record for ice cream machine (deviceId=4)
 */

const Database = require('better-sqlite3');

const DB_PATH = './coffee_machine.db';

console.log('=== INITIALIZING ICE CREAM MACHINE STATUS ===\n');

const db = new Database(DB_PATH);

try {
  // Check if ice cream status already exists
  const existingStatus = db.prepare('SELECT * FROM device_status WHERE device_id = 4 ORDER BY updated_at DESC LIMIT 1').get();

  if (existingStatus) {
    console.log('Ice cream machine status already exists:');
    console.log('  ID:', existingStatus.id);
    console.log('  Updated:', existingStatus.updated_at);
    console.log('  Matter Status:', existingStatus.matter_status_json);
    console.log('\nTo replace, delete existing record first.');
  } else {
    // Ice cream machine ingredients (deviceId=4)
    const iceCreamMatterStatus = {
      "IceMatter6": 1,   // Ice Cream Base - available (1 = in stock)
      "IceMatter7": 1,   // Vanilla Flavor - available
      "IceMatter8": 1,   // Chocolate Flavor - available
      "IceMatter9": 1,   // Ice Cream Cups - available
      "IceMatter10": 1   // Toppings Container - available
    };

    const iceCreamDeviceStatus = {
      "deviceStatus1": 1, // Main system OK
      "deviceStatus2": 1, // Freezer system OK
      "deviceStatus3": 1, // Dispenser OK
      "lhStatus": 1       // Printer OK
    };

    // Insert ice cream machine status
    const stmt = db.prepare(`
      INSERT INTO device_status (device_id, matter_status_json, device_status_json)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      4,
      JSON.stringify(iceCreamMatterStatus),
      JSON.stringify(iceCreamDeviceStatus)
    );

    console.log('Ice cream machine status inserted successfully!');
    console.log('  ID:', result.lastInsertRowid);
    console.log('  DeviceId: 4');
    console.log('  IceMatter6-10: All set to 1 (available)');
  }

  // Verify all device statuses
  console.log('\n=== CURRENT DEVICE STATUS RECORDS ===');
  const allStatuses = db.prepare('SELECT device_id, matter_status_json, updated_at FROM device_status ORDER BY device_id, updated_at DESC').all();

  const deviceGroups = {};
  allStatuses.forEach(s => {
    if (!deviceGroups[s.device_id]) {
      deviceGroups[s.device_id] = s;
    }
  });

  Object.entries(deviceGroups).forEach(([deviceId, status]) => {
    const deviceName = deviceId === '1' ? 'Coffee Machine' : deviceId === '4' ? 'Ice Cream Machine' : `Device ${deviceId}`;
    console.log(`\n${deviceName} (deviceId=${deviceId}):`);
    console.log('  Updated:', status.updated_at);
    const matterStatus = JSON.parse(status.matter_status_json);
    Object.entries(matterStatus).forEach(([key, value]) => {
      const statusText = value === 0 ? 'OUT OF STOCK' : 'Available';
      console.log(`  ${key}: ${value} (${statusText})`);
    });
  });

  console.log('\n=== INITIALIZATION COMPLETE ===');

} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  db.close();
}
