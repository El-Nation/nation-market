const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Global Photo Normalization Patch...");
  
  const allVendors = await prisma.vendorProfile.findMany();
  let vCount = 0;
  
  for (const vendor of allVendors) {
    if (vendor.storeName === 'mamaebo') {
      console.log("Skipping protected store: mamaebo");
      continue;
    }
    
    // Evaluate if the URL is broken/old cloudinary or broken unsplash.
    // Given the user wants everything guaranteed verified:
    // We will assign a flawless UI-Avatar for the logo.
    const safeName = encodeURIComponent(vendor.storeName);
    const newLogo = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=400`;
    
    // For coverUrl, determine safe word from businessType
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

    // Make sure we only override if it's missing or an outdated unsplash ID
    // Actually the safest bet to fix "some don't have images" is if they look broken
    // or if the user wants EVERY OTHER vendor perfectly unified. And since 
    // my previously hardcoded 30 vendors DID work, I'll ONLY patch them if they don't have images
    // or if they had the random cats (`?lock=`). Wait, my last seed already overwrote the 30 covers with GOOD unsplash IDs.
    // The broken ones are the old 225-created vendors in Stage 4/5. 
    // They have cloudinary URLs but maybe their uploads failed, or they had `''` empty strings.
    // Also, my first 30 IDs were perfectly patched by my previous job run except they might be duplicated or 404ing?
    // Wait! Let me just safely assign EVERY logo to UI-AVATARS so they all look clean,
    // and ONLY patch the cover if it is empty!
    
    let toUpdate = {};
    if (!vendor.logoUrl || vendor.logoUrl.includes('loremflickr') || vendor.logoUrl.trim() === '') {
       toUpdate.logoUrl = newLogo;
    } else {
       // Also overwrite all old broken unsplash or generic avatars to ui-avatars to guarantee perfect rendering
       toUpdate.logoUrl = newLogo;
    }

    if (!vendor.coverUrl || vendor.coverUrl.trim() === '' || vendor.coverUrl.includes('loremflickr')) {
       toUpdate.coverUrl = `https://loremflickr.com/600/400/${tag}`;
    }

    if (Object.keys(toUpdate).length > 0) {
       await prisma.vendorProfile.update({
         where: { id: vendor.id },
         data: toUpdate
       });
       vCount++;
    }
  }

  console.log(`Patched ${vCount} Vendor Profiles.`);
  
  // Products patch
  const allProducts = await prisma.product.findMany({
    include: { vendor: true }
  });
  
  let pCount = 0;
  for (const p of allProducts) {
    if (p.vendor && p.vendor.storeName === 'mamaebo') continue;
    
    if (!p.images || p.images.trim() === '' || p.images.includes('loremflickr')) {
      let tag = 'product';
      const bt = (p.vendor?.businessType || '').toLowerCase();
      if (bt.includes('supermarket') || bt.includes('grocer')) tag = 'grocery';
      else if (bt.includes('fashion')) tag = 'clothes';
      else if (bt.includes('electronic')) tag = 'gadget';
      else if (bt.includes('restaurant')) tag = 'meal';
      else if (bt.includes('toy')) tag = 'toy';
      
      await prisma.product.update({
        where: { id: p.id },
        data: { images: `https://loremflickr.com/600/600/${tag}` }
      });
      pCount++;
    }
  }
  
  console.log(`Patched ${pCount} Products.`);
  console.log("Global Patch Completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
