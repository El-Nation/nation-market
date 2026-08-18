const Database = require('better-sqlite3');
const db = new Database('./dev.db', { readonly: true });
const profiles = db.prepare("SELECT * FROM VendorProfile").all();
console.log(JSON.stringify(profiles, null, 2));
