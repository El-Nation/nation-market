const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Unconditional Forceful Photo Normalization Patch...");
  
  const allVendors = await prisma.vendorProfile.findMany();
  let vCount = 0;
  
  for (const vendor of allVendors) {
    if (vendor.storeName === 'mamaebo') {
      console.log("Skipping protected store: mamaebo");
      continue;
    }
    
    const safeName = encodeURIComponent(vendor.storeName);
    const newLogo = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=400`;
    
    let tag = 'store';
    const bt = (vendor.businessType || '').toLowerCase();
    if (bt.includes('supermarket') || bt.includes('grocer')) tag = 'supermarket';
    else if (bt.includes('fashion') || bt.includes('beauty')) tag = 'fashion';
    else if (bt.includes('electronic') || bt.includes('gadgets')) tag = 'electronics';
    else if (bt.includes('restaurant') || bt.includes('food')) tag = 'food';
    else if (bt.includes('agricultur') || bt.includes('farm')) tag = 'tractor';
    else if (bt.includes('pharmac') || bt.includes('health')) tag = 'medicine';
    else if (bt.includes('book') || bt.includes('education')) tag = 'books';
    else if (bt.includes('furniture') || bt.includes('kitchen')) tag = 'furniture';
    else if (bt.includes('automotive') || bt.includes('industrial')) tag = 'car';
    else if (bt.includes('toy') || bt.includes('babies')) tag = 'toys';

    const newCover = `https://loremflickr.com/600/400/${tag}?lock=${vCount}`;

    await prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: {
          logoUrl: newLogo,
          coverUrl: newCover
        }
    });
    vCount++;
  }

  console.log(`Unconditionally Patched ${vCount} Vendor Profiles.`);
  
  const allProducts = await prisma.product.findMany({
    include: { vendor: true }
  });
  
  let pCount = 0;
  for (const p of allProducts) {
    if (p.vendor && p.vendor.storeName === 'mamaebo') continue;
    
    let tag = 'product';
    const bt = (p.vendor?.businessType || '').toLowerCase();
    if (bt.includes('supermarket') || bt.includes('grocer')) tag = 'grocery';
    else if (bt.includes('fashion') || bt.includes('beauty')) tag = 'clothes';
    else if (bt.includes('electronic') || bt.includes('gadgets')) tag = 'gadget';
    else if (bt.includes('restaurant') || bt.includes('food')) tag = 'meal';
    else if (bt.includes('toy') || bt.includes('babies')) tag = 'toy';
    
    await prisma.product.update({
      where: { id: p.id },
      data: { images: `https://loremflickr.com/600/600/${tag}?lock=${pCount}` }
    });
    pCount++;
  }
  
  console.log(`Unconditionally Patched ${pCount} Products.`);
  console.log("Global Unconditional Patch Completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
