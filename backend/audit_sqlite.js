const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');

try {
  const db = new Database(dbPath, { readonly: true });
  console.log('--- SQLITE DATA COMPATIBILITY AUDIT ---');

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  for (const table of tables) {
    if (table.name === 'sqlite_sequence' || table.name.startsWith('_')) continue;
    
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
    console.log(`\nTable: ${table.name} (${count.count} rows)`);

    // We can do specific logic: for Category/Product we check invalid foreign keys if we want schemas.
    // Let's just list tables and exact counts, and do a quick sanity check.
  }
  
  // Specific checks for Nation Market
  console.log('\n--- SPECIFIC MIGRATION RISKS ---');
  
  // Example: Check if Order has orphan references
  try {
    const orders = db.prepare("SELECT id, userId FROM 'Order' WHERE userId IS NOT NULL AND userId NOT IN (SELECT id FROM User)").all();
    console.log(`Orphaned Orders (invalid userId): ${orders.length}`);
  } catch(e) {}
  
  // Checking User enum types (Role)
  try {
    const users = db.prepare("SELECT DISTINCT role FROM User").all();
    console.log(`User roles present: ${users.map(u => u.role).join(', ')}`);
  } catch(e) {}

  db.close();
} catch (err) {
  console.error('Failed to open SQLite database:', err.message);
}
