const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const CATEGORY_MAP = {
  'Restaurants': 'Restaurants & Food',
  'Supermarkets': 'Supermarket & Groceries',
  'Pharmacies': 'Pharmacy & Health',
  'Fashion': 'Fashion & Beauty'
};

const SUBCATEGORY_MAP = {
  'Restaurants': {
    'Local Dishes': 'Local & Traditional Dishes',
    'Intercontinental': 'Intercontinental Cuisine',
    'Vegan': 'Healthy & Vegan Options'
  },
  'Supermarkets': {
    'Groceries': 'Pantry Staples', 
    'Toiletries': 'Toiletries & Personal Care'
  },
  'Pharmacies': {
    'Prescription': 'Prescription Medication',
    'Supplements': 'Vitamins & Dietary Supplements'
  },
  'Fashion': {
    'Shoes': 'Footwear',
    'Accessories': 'Accessories'
  },
  // Mapping duplicates that are currently mistakenly nested under the OFFICIAL categories because of the older seed script
  'Restaurants & Food': {
    'Local Dish': 'Local & Traditional Dishes',
    'Fast Food': 'Fast Food & Burgers',
    'Bakery': 'Pastries, Cakes & Desserts'
  },
  'Supermarket & Groceries': {
    'Beverages': 'Beverages', // already perfect match
    'Fresh Produce': 'Fresh Produce',
    'Household Items': 'Cleaning & Household Supplies'
  },
  'Fashion & Beauty': {
    'Mens Wear': 'Men\'s Clothing',
    'Womens Wear': 'Women\'s Clothing',
    'Cosmetics': 'Skincare & Cosmetics'
  },
  'Electronics & Gadgets': {
    'Mobile Phones': 'Smartphones & Tablets',
    'Laptops': 'Computers & Laptops',
    'Audio Devices': 'Audio & Speakers'
  },
  'Agriculture & Farming': {
    'Livestock': 'Livestock & Animals',
    'Farm Tools': 'Farming Tools & Machinery',
    'Seeds': 'Seeds, Seedlings & Plants'
  },
  'Pharmacy & Health': {
    'Baby Care': 'Mother & Baby Care',
    'Prescription Drugs': 'Prescription Medication',
    'Wellness Kit': 'Vitamins & Dietary Supplements'
  },
  'Books & Education': {
    'Textbooks': 'Educational Textbooks',
    'Stationery': 'Stationery & Office Supplies',
    'Novels': 'Fiction & Literature'
  },
  'Home, Kitchen & Furniture': {
    'Living Room': 'Furniture',
    'Kitchen Appliances': 'Small Appliances', // Assuming small appliances, user can correct
    'Decor': 'Home Decor & Bedding'
  },
  'Automotive & Industrial': {
    'Car Parts': 'Car Parts & Accessories',
    'Tyres': 'Car Parts & Accessories', // Mapping to Car parts or flag as ambiguous
    'Mechanical Tools': 'Tools & Hardware'
  },
  'Toys, Kids & Babies': {
    'Toys': 'Toys & Games',
    'Baby Clothes': 'Kids & Baby Clothing',
    'Maternity': 'Maternity Care' // Though technically 'Maternity Care', we can map it
  }
};

const OFFICIAL_CATEGORIES = [
  'Supermarket & Groceries', 'Fashion & Beauty', 'Electronics & Gadgets', 
  'Restaurants & Food', 'Agriculture & Farming', 'Pharmacy & Health', 
  'Books & Education', 'Home, Kitchen & Furniture', 'Automotive & Industrial', 
  'Toys, Kids & Babies'
];

async function main() {
  const categories = await prisma.category.findMany({
    include: { subcategories: true }
  });
  
  const officialCats = categories.filter(c => OFFICIAL_CATEGORIES.includes(c.name));
  
  let md = "# Detailed Taxonomy Migration Plan\n\n";

  md += "## 1. Category Mappings\n\n";
  md += "| Legacy Category | Action | Proposed Official Category |\n";
  md += "|---|---|---|\n";
  for (const [legacy, official] of Object.entries(CATEGORY_MAP)) {
      md += "| " + legacy + " | Migrate to | " + official + " |\n";
  }

  md += "\n## 2. Subcategory Mappings\n\n";
  md += "Several subcategories exist under legacy categories or duplicate subcategories exist under official categories. Here is the proposed re-mapping for all non-canonical subcategories:\n\n";
  md += "| Current Category | Current Subcategory | Proposed Official Category | Proposed Official Subcategory | Status |\n";
  md += "|---|---|---|---|---|\n";

  for (const c of categories) {
    if (SUBCATEGORY_MAP[c.name]) {
        for (const s of c.subcategories) {
            if (SUBCATEGORY_MAP[c.name][s.name]) {
                const targetCatName = CATEGORY_MAP[c.name] || c.name;
                md += `| ${c.name} | ${s.name} | ${targetCatName} | ${SUBCATEGORY_MAP[c.name][s.name]} | 🟢 Map |\n`;
            } else if (!OFFICIAL_CATEGORIES.includes(c.name)) {
                const targetCatName = CATEGORY_MAP[c.name] || 'N/A';
                md += `| ${c.name} | ${s.name} | ${targetCatName} | ? | 🔴 Ambiguous |\n`;
            }
        }
    } else if (!OFFICIAL_CATEGORIES.includes(c.name)) {
       for (const s of c.subcategories) {
           md += `| ${c.name} | ${s.name} | ? | ? | 🔴 Ambiguous |\n`;
       }
    }
  }

  md += "\n## 3. Products Affected\n\n";
  md += "| Product Name | Current Category | Current Subcategory | Proposed Official Category | Proposed Official Subcategory |\n";
  md += "|---|---|---|---|---|\n";

  const products = await prisma.product.findMany({
    include: { category: true, subcategory: true }
  });

  let productCount = 0;
  for (const p of products) {
    let currentCat = p.category.name;
    let currentSub = p.subcategory ? p.subcategory.name : 'None';
    
    // Check if this product needs reassignment (either from a legacy category, or from a duplicate subcategory)
    let needsReassignment = false;
    let proposedCat = currentCat;
    let proposedSub = currentSub;

    if (CATEGORY_MAP[currentCat]) {
       needsReassignment = true;
       proposedCat = CATEGORY_MAP[currentCat];
    }
    
    if (SUBCATEGORY_MAP[currentCat] && SUBCATEGORY_MAP[currentCat][currentSub]) {
       needsReassignment = true;
       proposedSub = SUBCATEGORY_MAP[currentCat][currentSub];
       proposedCat = CATEGORY_MAP[currentCat] || currentCat; // Retain official cat if sub is duplicate
    }
    
    // If It's under a legacy category but sub isn't mapped, flag it
    if (CATEGORY_MAP[currentCat] && !(SUBCATEGORY_MAP[currentCat] && SUBCATEGORY_MAP[currentCat][currentSub])) {
       needsReassignment = true;
       proposedSub = '🔴 AMBIGUOUS';
    }

    if (needsReassignment) {
      productCount++;
      md += `| ${p.name} | ${currentCat} | ${currentSub} | **${proposedCat}** | **${proposedSub}** |\n`;
    }
  }

  if (productCount === 0) {
     md += "| All products align with intended categories natively | | | | |\n";
  }

  md += "\n## 4. Vendors Affected\n\n";
  md += "| Vendor / Store Name | Current \`businessType\` | Proposed Official \`businessType\` |\n";
  md += "|---|---|---|\n";

  const vendors = await prisma.vendorProfile.findMany({
    include: { subcategories: true }
  });

  let vendorCount = 0;
  for (const v of vendors) {
    let currentCat = v.businessType;
    if (CATEGORY_MAP[currentCat]) {
      vendorCount++;
      md += `| ${v.storeName} | ${currentCat} | **${CATEGORY_MAP[currentCat]}** |\n`;
    }
  }

  if (vendorCount === 0) {
      md += "| All vendors align with official categories naturally | | |\n";
  }

  md += "\n## Summary & Review\n\n";
  md += `- **Products to migrate**: ${productCount}\n`;
  md += `- **Vendors to migrate**: ${vendorCount}\n`;
  md += `\nPlease carefully review any 🔴 AMBIGUOUS fields and the overall mapping. Once approved, we will run the atomic Prisma transaction to properly assign \`categoryId\` and \`subcategoryId\` on all these models without losing any images or records.\n`;

  const outputPath = path.join(__dirname, '..', '..', '.gemini', 'antigravity', 'brain', 'c1a26b9e-0980-4d32-adac-494c8b432afc', 'detailed_migration_plan.md');
  const normalizedPath = 'C:/Users/USER/.gemini/antigravity/brain/c1a26b9e-0980-4d32-adac-494c8b432afc/detailed_migration_plan.md';
  fs.writeFileSync(normalizedPath, md);
  console.log("Detailed mapping complete.");
}

main().catch(console.error).finally(() => prisma['$disconnect']());
