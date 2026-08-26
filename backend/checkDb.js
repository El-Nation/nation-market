const db = require('better-sqlite3')('dev.db');
const p = db.prepare(`SELECT name, images FROM Product WHERE name LIKE '%Teddy%' LIMIT 1`).get();
console.log('Teddy =>', p);
