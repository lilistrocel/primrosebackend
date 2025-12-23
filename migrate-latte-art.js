/**
 * Migration Script: Replace latte art designs from old database
 */

const Database = require('better-sqlite3');

const OLD_DB_PATH = './imported-database/coffee_machine.db';
const NEW_DB_PATH = './coffee_machine.db';

console.log('=== MIGRATING LATTE ART DESIGNS ===\n');

const oldDb = new Database(OLD_DB_PATH, { readonly: true });
const newDb = new Database(NEW_DB_PATH);

try {
  // Delete existing designs
  console.log('Deleting existing latte art designs...');
  const deleteResult = newDb.prepare('DELETE FROM latte_art_designs').run();
  console.log('Deleted:', deleteResult.changes, 'designs\n');

  // Get old designs
  const oldDesigns = oldDb.prepare('SELECT * FROM latte_art_designs').all();
  console.log('Found', oldDesigns.length, 'designs in old database\n');

  // Insert old designs
  const insertStmt = newDb.prepare(`
    INSERT INTO latte_art_designs (id, name, description, image_path, is_default, is_active, display_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const d of oldDesigns) {
    try {
      insertStmt.run(d.id, d.name, d.description, d.image_path, d.is_default, d.is_active, d.display_order, d.created_at, d.updated_at);
      const status = d.is_active ? '✅ ACTIVE' : '⬜ inactive';
      console.log(status, '| ID:', d.id, '|', d.name, '|', d.image_path);
      count++;
    } catch (e) {
      console.log('❌ Failed:', d.name, '-', e.message);
    }
  }

  console.log('\nMigrated', count, 'latte art designs');

  // Verify
  console.log('\n=== VERIFICATION ===');
  const newDesigns = newDb.prepare('SELECT id, name, is_active, image_path FROM latte_art_designs ORDER BY display_order, id').all();
  console.log('Total designs:', newDesigns.length);
  console.log('Active designs:', newDesigns.filter(d => d.is_active).length);

  console.log('\n✅ Latte Art Migration Complete!');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  oldDb.close();
  newDb.close();
}
