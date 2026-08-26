const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const dbBackupPath = path.join(__dirname, '..', 'dev.db.bak');

console.log("Creating database backup point...");
fs.copyFileSync(dbPath, dbBackupPath);
console.log("Backup securely saved successfully!");

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const CATEGORY_MAP = {
  'Restaurants': 'Restaurants & Food',
  'Supermarkets': 'Supermarket & Groceries',
  'Pharmacies': 'Pharmacy & Health',
  'Fashion': 'Fashion & Beauty'
};

const SUBCATEGORY_MAP = {
  // Official Adjustments
  'Restaurants & Food': { 'Local Dish': 'Local & Traditional Dishes', 'Fast Food': 'Fast Food & Burgers', 'Bakery': 'Pastries, Cakes & Desserts' },
  'Supermarket & Groceries': { 'Beverages': 'Beverages', 'Fresh Produce': 'Fresh Produce', 'Household Items': 'Cleaning & Household Supplies' },
  'Fashion & Beauty': { 'Mens Wear': 'Men\'s Clothing', 'Womens Wear': 'Women\'s Clothing', 'Cosmetics': 'Skincare & Cosmetics' },
  'Electronics & Gadgets': { 'Mobile Phones': 'Smartphones & Tablets', 'Laptops': 'Computers & Laptops', 'Audio Devices': 'Audio & Speakers' },
  'Agriculture & Farming': { 'Livestock': 'Livestock & Animals', 'Farm Tools': 'Farming Tools & Machinery', 'Seeds': 'Seeds, Seedlings & Plants' },
  'Pharmacy & Health': { 'Baby Care': 'Mother & Baby Care', 'Prescription Drugs': 'Prescription Medication', 'Wellness Kit': 'Vitamins & Dietary Supplements' },
  'Books & Education': { 'Textbooks': 'Educational Textbooks', 'Stationery': 'Stationery & Office Supplies', 'Novels': 'Fiction & Literature' },
  'Home, Kitchen & Furniture': { 'Living Room': 'Furniture', 'Kitchen Appliances': 'Small Appliances', 'Decor': 'Home Decor & Bedding' },
  'Automotive & Industrial': { 'Car Parts': 'Car Parts & Accessories', 'Tyres': 'Car Parts & Accessories', 'Mechanical Tools': 'Tools & Hardware' },
  'Toys, Kids & Babies': { 'Toys': 'Toys & Games', 'Baby Clothes': 'Kids & Baby Clothing', 'Maternity': 'Maternity Care' },
  
  // Legacy Adjustments
  'Restaurants': { 'Local Dishes': 'Local & Traditional Dishes', 'Intercontinental': 'Intercontinental Cuisine', 'Vegan': 'Healthy & Vegan Options' },
  'Supermarkets': { 'Groceries': 'Pantry Staples', 'Toiletries': 'Toiletries & Personal Care' },
  'Pharmacies': { 'Prescription': 'Prescription Medication', 'Supplements': 'Vitamins & Dietary Supplements' },
  'Fashion': { 'Shoes': 'Footwear', 'Accessories': 'Accessories' },
  
  // Handling ambiguous products overrides safely targeting combo keys:
  'Restaurants|Fast Food': 'Fast Food & Burgers',
  'Supermarkets|Beverages': 'Beverages',
  'Pharmacies|Baby Care': 'Mother & Baby Care',
  'Fashion|Womens Wear': 'Women\'s Clothing',
  'Fashion|Mens Wear': 'Men\'s Clothing'
};

async function main() {
  console.log("Loading taxonomy schema...");
  
  const categoriesDb = await prisma.category.findMany({ include: { subcategories: true } });
  const getCat = (name) => categoriesDb.find(c => c.name === name);
  const getSub = (cat, subName) => cat?.subcategories.find(s => s.name === subName);

  const allProducts = await prisma.product.findMany({
    include: { category: true, subcategory: true, vendor: true }
  });
  const allVendors = await prisma.vendorProfile.findMany();

  let transactionOperations = [];
  let productMigrationSummary = [];

  for (const p of allProducts) {
    let currentCat = p.category.name;
    let currentSub = p.subcategory ? p.subcategory.name : null;
    
    let targetCatName = currentCat;
    let targetSubName = currentSub;
    let needsReassign = false;

    if (CATEGORY_MAP[currentCat]) {
       targetCatName = CATEGORY_MAP[currentCat];
       needsReassign = true;
    }
    
    let comboKey = currentCat + "|" + currentSub;
    
    // Explicit override for Baby Clothes changing main category
    if (comboKey === "Toys, Kids & Babies|Baby Clothes") {
       targetCatName = 'Fashion & Beauty';
       targetSubName = 'Kids & Baby Clothing';
       needsReassign = true;
    } else if (SUBCATEGORY_MAP[comboKey]) {
       targetSubName = SUBCATEGORY_MAP[comboKey];
       targetCatName = CATEGORY_MAP[currentCat] || currentCat;
       needsReassign = true;
    } else if (SUBCATEGORY_MAP[currentCat] && SUBCATEGORY_MAP[currentCat][currentSub]) {
       targetSubName = SUBCATEGORY_MAP[currentCat][currentSub];
       targetCatName = CATEGORY_MAP[currentCat] || currentCat;
       needsReassign = true;
    }

    if (needsReassign) {
       let targetCat = getCat(targetCatName);
       if (!targetCat) throw new Error(`Target category ${targetCatName} not found!`);
       
       let targetSub = null;
       if (targetSubName) {
           targetSub = getSub(targetCat, targetSubName);
           if (!targetSub) throw new Error(`Target subcategory ${targetSubName} not found in ${targetCatName}!`);
       }

       transactionOperations.push(
          prisma.product.update({
             where: { id: p.id },
             data: {
                categoryId: targetCat.id,
                subcategoryId: targetSub ? targetSub.id : null
             }
          })
       );
       productMigrationSummary.push(`Product ${p.id} migrated ${currentCat}->${targetCatName}`);
    }
  }

  let vendorMigrationSummary = [];
  for (const v of allVendors) {
    let currentCat = v.businessType;
    if (CATEGORY_MAP[currentCat]) {
       let targetCatName = CATEGORY_MAP[currentCat];
       transactionOperations.push(
          prisma.vendorProfile.update({
             where: { id: v.id },
             data: { businessType: targetCatName }
          })
       );
       vendorMigrationSummary.push(`Vendor ${v.id} migrated ${currentCat}->${targetCatName}`);
    }
  }

  console.log(`\Prepared ${transactionOperations.length} atomic operations (${productMigrationSummary.length} products, ${vendorMigrationSummary.length} vendors)`);

  if (transactionOperations.length > 0) {
      console.log('Executing Prisma Database Transaction atomically...');
      await prisma.$transaction(transactionOperations);
      console.log('Transaction executed and validated safely!');
  }

  console.log('Running Post-Migration Verification Queries...');

  const legacyStrings = Object.keys(CATEGORY_MAP);
  
  // Verify 0 legacy products
  const productsInLegacy = await prisma.product.count({
    where: { category: { name: { in: legacyStrings } } }
  });
  
  // Verify 0 legacy vendors
  const vendorsInLegacy = await prisma.vendorProfile.count({
    where: { businessType: { in: legacyStrings } }
  });

  const legacySubObjKeys = [];
  for (const [k, vObj] of Object.entries(SUBCATEGORY_MAP)) {
      if (!k.includes("|")) {
          legacySubObjKeys.push(...Object.keys(vObj));
      }
  }
  const productsInLegacySubcategories = await prisma.product.count({
      where: { subcategory: { name: { in: legacySubObjKeys } } }
  });

  console.log("");
  console.log("=== VITAL METRICS ===");
  console.log(`Affected Products Updated: ${productMigrationSummary.length}`);
  console.log(`Affected Vendors Updated: ${vendorMigrationSummary.length}`);
  console.log(`Products remaining attached to legacy Categories: ${productsInLegacy}`);
  console.log(`Products remaining attached to legacy Subcategories: ${productsInLegacySubcategories}`);
  console.log(`Vendors remaining attached to legacy Categories: ${vendorsInLegacy}`);
  console.log("All legacy entities remain undeleted in db as instructed.");
  
}

main().catch(console.error).finally(() => prisma['$disconnect']());
