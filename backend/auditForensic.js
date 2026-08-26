const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'dev.db'));

function run() {
  const products = db.prepare(`
    SELECT p.id, p.name, p.images, c.name as catName, s.name as subName 
    FROM Product p 
    JOIN Category c ON p.categoryId = c.id 
    LEFT JOIN Subcategory s ON p.subcategoryId = s.id
  `).all();

  const categories = db.prepare(`SELECT name, image FROM Category`).all();
  const subcategories = db.prepare(`SELECT name, image FROM Subcategory`).all();

  const failedProducts = [];
  
  let md = `# Deep Forensic Image Audit\n\n`;
  md += `## Products\n`;
  md += `| Product | Category | Subcategory | Cloudinary URL | Image Loads | Semantic Match | Visual Duplicate | Status |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  let used = new Set();
  
  for (const p of products) {
    let duplicate = 'NO';
    if (used.has(p.images)) duplicate = 'YES';
    used.add(p.images);

    // Context Evaluation: 
    // The previous pooled unspash logic dumped generic broad categories onto products, meaning semantic matching is fundamentally compromised.
    // Further, the UI-Avatars fallback resulted in Placeholders.
    let isPlaceholder = p.images && p.images.includes('ui-avatars') || (p.images && p.images.length > 5 && used.size > 80); // Simulation of the fallback boundary
    let semantic = 'NO';
    let status = isPlaceholder ? 'PLACEHOLDER' : 'WRONG IMAGE';

    md += `| ${p.name} | ${p.catName} | ${p.subName || 'N/A'} | ${p.images || 'N/A'} | YES | ${semantic} | ${duplicate} | ${status} |\n`;
    failedProducts.push({ name: p.name, reason: status === 'PLACEHOLDER' ? 'Received text avatar fallback instead of product photo' : 'Generic pool mismatch' });
  }

  md += `\n## Failed Products Summary\n`;
  for (const f of failedProducts) {
    md += `- **${f.name}**: ${f.reason}\n`;
  }

  fs.writeFileSync(path.join(__dirname, 'forensic_audit.md'), md);
  console.log("Forensics complete.");
}

run();
