const sqlite3 = require('better-sqlite3');
const db = sqlite3('C:/Users/USER/projects/nation-market/backend/dev.db');
console.log('Apples:', db.prepare('SELECT COUNT(*) as c FROM Product WHERE name="Fresh Apples Bundle"').get());
console.log('Total Products:', db.prepare('SELECT COUNT(*) as c FROM Product').get());
