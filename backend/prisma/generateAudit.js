const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        include: { products: true, vendors: true }
      },
      products: true
    }
  });

  const allVendors = await prisma.vendorProfile.findMany({ include: { products: true, subcategories: true } });

  let r = '## Stage 9 Category & Subcategory Audit\n\n### Primary Categories\n\n| Category | Has Image? | Image Correct? | Products | Vendors | Needs Content? | Image URL |\n|---|---|---|---|---|---|---|\n';
  let b_cats = [];
  let b_subs = [];

  for (const c of categories) {
      let vn = allVendors.filter(v => v.businessType === c.name || v.products.some(x => x.categoryId === c.id)).length;
      let pn = c.products.length;
      
      let imgStatus = c.imageUrl ? 'Yes' : 'No';
      let imgCorrect = c.imageUrl ? 'Needs Visual Verification' : 'N/A';
      let needs = (vn < 3 || pn < 3) ? 'Yes' : 'No';
      let url = c.imageUrl || 'None';
      
      r += `| ${c.name} | ${imgStatus} | ${imgCorrect} | ${pn} | ${vn} | ${needs} | ${url} |\n`;
      if (!c.imageUrl) b_cats.push(c.name);
  }

  r += '\n### Subcategories\n\n| Category | Subcategory | Has Image? | Image Correct? | Products | Needs Content? | Image URL |\n|---|---|---|---|---|---|---|\n';

  for (const c of categories) {
      for (const s of c.subcategories) {
          let pn = s.products.length;
          let imgStatus = s.imageUrl ? 'Yes' : 'No';
          let imgCorrect = s.imageUrl ? 'Needs Visual Verification' : 'N/A';
          let needs = pn < 3 ? 'Yes' : 'No';
          let url = s.imageUrl || 'None';

          r += `| ${c.name} | ${s.name} | ${imgStatus} | ${imgCorrect} | ${pn} | ${needs} | ${url} |\n`;
          if (!s.imageUrl) b_subs.push(s.name);
      }
  }

  r += '\n### A. Categories that are already complete\n';
  r += 'None fully complete (missing imagery natively).\n';

  r += '\n### B. Categories missing images\n';
  r += b_cats.join(', ') || 'None';

  r += '\n### C. Categories with incorrect images\n';
  r += 'None evaluated manually yet.\n';

  r += '\n### D. Subcategories missing images\n';
  r += b_subs.join(', ') || 'None';

  r += '\n### E. Subcategories with incorrect images\n';
  r += 'None evaluated manually yet.\n';

  r += '\n### F. Categories needing sample products\n';
  r += '(See Needs Content Column)\n';

  r += '\n### G. Subcategories needing sample products\n';
  r += '(See Needs Content Column)\n';

  r += '\n### H. Recommended image/content additions\n';
  r += '- All Categories and Subcategories must be physically updated to feature contextual static `imageUrl` records spanning Unsplash.\n';
  r += '- We must generate minimum 3 products per Subcategory to fill voids.';
  
  const outfile = path.join(__dirname, 'audit_report2.md');
  fs.writeFileSync(outfile, r);
  console.log(outfile);
}

main().catch(console.error).finally(() => prisma['$disconnect']());
