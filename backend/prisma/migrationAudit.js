const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const OFFICIAL_CATEGORIES = [
  'Supermarket & Groceries',
  'Fashion & Beauty',
  'Electronics & Gadgets',
  'Restaurants & Food',
  'Agriculture & Farming',
  'Pharmacy & Health',
  'Books & Education',
  'Home, Kitchen & Furniture',
  'Automotive & Industrial',
  'Toys, Kids & Babies'
];

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        include: { products: true, vendors: true }
      },
      products: true
    }
  });

  const vendors = await prisma.vendorProfile.findMany({
    include: { products: true, subcategories: true }
  });

  let report = `# Stage 9 Taxonomy Migration & Cleanup Strategy\n\n`;

  report += `## 1. Official Categories to Keep\n\n`;
  report += `| Category | Subcategories Count | Products Count | Vendors Bound |\n`;
  report += `|---|---|---|---|\n`;

  const officialData = [];
  const legacyData = [];
  
  for (const cat of categories) {
    const isOfficial = OFFICIAL_CATEGORIES.includes(cat.name);
    
    let vendorCount = 0;
    // Calculate vendors tied to this category
    for (const v of vendors) {
      if (v.businessType === cat.name || v.products.some(p => p.categoryId === cat.id)) {
        vendorCount++;
      }
    }

    const data = {
      name: cat.name,
      subCount: cat.subcategories.length,
      prodCount: cat.products.length,
      vendCount: vendorCount,
      subs: cat.subcategories
    };

    if (isOfficial) officialData.push(data);
    else legacyData.push(data);
  }

  for (const d of officialData) {
    report += `| ${d.name} | ${d.subCount} | ${d.prodCount} | ${d.vendCount} |\n`;
  }

  report += `\n## 2. Legacy Categories to Retire\n\n`;
  report += `| Category | Subcategories Count | Products Count | Vendors Bound |\n`;
  report += `|---|---|---|---|\n`;
  
  for (const d of legacyData) {
    report += `| ${d.name} | ${d.subCount} | ${d.prodCount} | ${d.vendCount} |\n`;
  }

  report += `\n## 3. Subcategories Mapping Analysis\n\n`;
  
  // Official Subs
  report += `### Official Subcategories to Keep\n`;
  report += `| Category | Subcategory | Products | Vendors |\n`;
  report += `|---|---|---|---|\n`;
  for (const d of officialData) {
    for (const sub of d.subs) {
       report += `| ${d.name} | ${sub.name} | ${sub.products.length} | ${sub.vendors.length} |\n`;
    }
  }

  report += `\n### Legacy Subcategories to Retire\n`;
  report += `| Category | Subcategory | Products | Vendors |\n`;
  report += `|---|---|---|---|\n`;
  for (const d of legacyData) {
    for (const sub of d.subs) {
       report += `| ${d.name} | ${sub.name} | ${sub.products.length} | ${sub.vendors.length} |\n`;
    }
  }

  report += `\n## 4. Products Needing Reassignment\n\n`;
  report += `The following products are attached to legacy categories and must be safely migrated:\n\n`;
  let totalLegacyProds = 0;
  for (const d of legacyData) {
    const catProds = await prisma.product.findMany({ where: { category: { name: d.name } } });
    if(catProds.length > 0) {
      report += `- **${d.name}**: ${catProds.length} products to reassigned\n`;
      totalLegacyProds += catProds.length;
    }
  }
  if (totalLegacyProds === 0) report += `- None found.\n`;

  report += `\n## 5. Vendors Needing Reassignment\n\n`;
  report += `The following vendors list a legacy category as their \`businessType\` or have legacy subcategories connected:\n\n`;
  let legacyVendors = 0;
  for (const v of vendors) {
    if (!OFFICIAL_CATEGORIES.includes(v.businessType)) {
      report += `- **${v.storeName}** (Current ID: ${v.businessType}) - Needs reassignment\n`;
      legacyVendors++;
    }
  }
  if (legacyVendors === 0) report += `- None found.\n`;

  report += `\n## 6. Migration Risk Analysis & Recommended Strategy\n\n`;
  report += `**Risks:**\n`;
  report += `- If vendors or products are deleted, we will lose mock data breaking storefront discovery.\n`;
  report += `- Hardcoded slugs in frontend components could break if legacy categories are dropped without updating routes.\n`;
  
  report += `\n**Recommended Strategy:**\n`;
  report += `1. **Mapping:** Programmatically map every legacy category to its official counterpart (e.g., 'Restaurants' -> 'Restaurants & Food').\n`;
  report += `2. **Subcategories Sync:** For every legacy subcategory, find or create an equivalent under the Official Category (e.g., 'Fast Food').\n`;
  report += `3. **Data Reassignment (Prisma Update):** Atomic update of \`categoryId\` and \`subcategoryId\` on all affected \`Product\` and \`VendorProfile\` records.\n`;
  report += `4. **Cleanup:** Once counts in legacy categories are explicitly 0, we perform a safe \`prisma.category.delete\` and \`prisma.subcategory.delete\`.\n`;

  const outfile = path.join(__dirname, '..', '..', '.gemini', 'antigravity', 'brain', 'c1a26b9e-0980-4d32-adac-494c8b432afc', 'migration_report.md');
  // Use explicit path so it writes directly to the brain dir
  const brainPath = 'C:/Users/USER/.gemini/antigravity/brain/c1a26b9e-0980-4d32-adac-494c8b432afc/migration_report.md';
  fs.writeFileSync(brainPath, report);
  console.log('Migration report generated.');
}

main().catch(console.error).finally(() => prisma['$disconnect']());
