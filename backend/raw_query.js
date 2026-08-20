const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const cats = db.prepare("SELECT * FROM Category").all();
console.log("Categories:", cats.length);
if (cats.length > 0) {
  console.log(cats[0]);
}

const subcats = db.prepare("SELECT * FROM Subcategory").all();
console.log("Subcategories:", subcats.length);
if (subcats.length > 0) {
  console.log(subcats[0]);
}

db.close();
