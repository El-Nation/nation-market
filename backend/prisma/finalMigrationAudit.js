const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

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
  'Restaurants & Food': { 'Local Dish': 'Local & Traditional Dishes', 'Fast Food': 'Fast Food & Burgers', 'Bakery': 'Pastries, Cakes & Desserts' },
  'Supermarket & Groceries': { 'Household Items': 'Cleaning & Household Supplies' },
  'Fashion & Beauty': { 'Mens Wear': 'Men\'s Clothing', 'Womens Wear': 'Women\'s Clothing', 'Cosmetics': 'Skincare & Cosmetics' },
  'Electronics & Gadgets': { 'Mobile Phones': 'Smartphones & Tablets', 'Laptops': 'Computers & Laptops', 'Audio Devices': 'Audio & Speakers' },
  'Agriculture & Farming': { 'Livestock': 'Livestock & Animals', 'Farm Tools': 'Farming Tools & Machinery', 'Seeds': 'Seeds, Seedlings & Plants' },
  'Pharmacy & Health': { 'Baby Care': 'Mother & Baby Care', 'Prescription Drugs': 'Prescription Medication', 'Wellness Kit': 'Vitamins & Dietary Supplements' },
  'Books & Education': { 'Textbooks': 'Educational Textbooks', 'Stationery': 'Stationery & Office Supplies', 'Novels': 'Fiction & Literature' },
  'Home, Kitchen & Furniture': { 'Living Room': 'Furniture', 'Kitchen Appliances': 'Small Appliances', 'Decor': 'Home Decor & Bedding' },
  'Automotive & Industrial': { 'Car Parts': 'Car Parts & Accessories', 'Tyres': 'Car Parts & Accessories', 'Mechanical Tools': 'Tools & Hardware' },
  'Toys, Kids & Babies': { 'Toys': 'Toys & Games', 'Baby Clothes': 'Kids & Baby Clothing', 'Maternity': 'Maternity Care' },
  'Restaurants': { 'Local Dishes': 'Local & Traditional Dishes', 'Intercontinental': 'Intercontinental Cuisine', 'Vegan': 'Healthy & Vegan Options' },
  'Supermarkets': { 'Groceries': 'Pantry Staples', 'Toiletries': 'Toiletries & Personal Care' },
  'Pharmacies': { 'Prescription': 'Prescription Medication', 'Supplements': 'Vitamins & Dietary Supplements' },
  'Fashion': { 'Shoes': 'Footwear', 'Accessories': 'Accessories' }
};

async function main() {
  const allProducts = await prisma.product.findMany({
    include: {
      category: true,
      subcategory: true,
      vendor: true,
      _count: {
        select: { orderItems: true, wishlists: true, reviews: true }
      }
    }
  });

  const allVendors = await prisma.vendorProfile.findMany({
    include: {
      _count: { select: { orders: true, products: true } }
    }
  });

  let prodToMigrate = new Set();
  let vendToMigrate = new Set();
  
  let totalOrderItems = 0;
  let totalWishlists = 0;
  let hasCloudinary = false;

  let ambiguousItemsLog = [];

  for (const p of allProducts) {
    let currentCat = p.category.name;
    let currentSub = p.subcategory ? p.subcategory.name : null;
    
    let needsReassign = false;
    let isAmbiguous = false;

    if (CATEGORY_MAP[currentCat]) needsReassign = true;
    if (SUBCATEGORY_MAP[currentCat] && SUBCATEGORY_MAP[currentCat][currentSub]) needsReassign = true;
    
    // Explicitly unmapped legacy subcategories
    if (CATEGORY_MAP[currentCat] && !(SUBCATEGORY_MAP[currentCat] && SUBCATEGORY_MAP[currentCat][currentSub])) {
      needsReassign = true;
      isAmbiguous = true;
    }
    
    // Check if it's one of the specific ambiguous instances
    if (
      p.name.includes("KFC Branch") || 
      p.name.includes("Shoprite Connect") || 
      p.name.includes("Nett Pharmacy") || 
      p.name.includes("Zara Boutique") || 
      p.name.includes("Lagos Tailors")
    ) {
        isAmbiguous = true;
    }
    
    if (needsReassign || isAmbiguous) prodToMigrate.add(p.id);

    if (prodToMigrate.has(p.id)) {
      totalOrderItems += p._count.orderItems;
      totalWishlists += p._count.wishlists;
      if (p.images.includes('cloudinary.com')) hasCloudinary = true;

      if (isAmbiguous) {
         ambiguousItemsLog.push({
           name: p.name,
           desc: p.description,
           category: currentCat,
           sub: currentSub,
           price: p.price,
           vendor: p.vendor.storeName,
           imageUrl: p.images
         });
      }
    }
  }

  for (const v of allVendors) {
    let currentCat = v.businessType;
    if (CATEGORY_MAP[currentCat]) {
      vendToMigrate.add(v.id);
    }
  }

  const reportData = {
    uniqueProductsToMigrate: prodToMigrate.size,
    uniqueVendorsToMigrate: vendToMigrate.size,
    relationsIntact: {
       orderItemsPreserved: totalOrderItems,
       wishlistsPreserved: totalWishlists,
       cloudinaryDetected: hasCloudinary
    },
    ambiguousRecords: ambiguousItemsLog
  };

  console.log(JSON.stringify(reportData, null, 2));
}

main().catch(console.error).finally(() => prisma['$disconnect']());
