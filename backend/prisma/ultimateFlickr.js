const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Globally Unique Contextual Media Re-Assignment...");

  let globalIdCounter = parseInt(Date.now().toString().slice(-5)); // Ensure entirely new lock series from any prior run

  const allVendors = await prisma.vendorProfile.findMany({ include: { products: true } });
  let updatedCount = 0;

  for (const v of allVendors) {
    if (v.storeName === 'mamaebo') continue;
    
    const bt = (v.businessType || v.category?.name || '').toLowerCase();
    let tags = 'store,shop';
    
    if (bt.includes('supermarket') || bt.includes('grocer')) tags = 'grocery,supermarket';
    else if (bt.includes('fashion') || bt.includes('beauty')) tags = 'clothing,fashion,boutique';
    else if (bt.includes('electronic') || bt.includes('gadget')) tags = 'technology,gadgets,electronics';
    else if (bt.includes('restaurant') || bt.includes('food')) tags = 'food,meal,restaurant';
    else if (bt.includes('agricultur') || bt.includes('farming')) tags = 'farming,agriculture,crops';
    else if (bt.includes('pharmac') || bt.includes('health')) tags = 'medicine,hospital,pharmacy';
    else if (bt.includes('book') || bt.includes('education')) tags = 'books,library,reading';
    else if (bt.includes('furniture') || bt.includes('kitchen')) tags = 'furniture,kitchen,interior';
    else if (bt.includes('automotive') || bt.includes('industrial')) tags = 'automotive,mechanic,garage';
    else if (bt.includes('toy') || bt.includes('babies')) tags = 'toys,playground';

    // Global Unique Lock for Cover
    globalIdCounter++;
    const newCover = `https://loremflickr.com/600/400/${tags}/all?lock=${globalIdCounter}`;
    
    // UI Avatars for consistent clean logos
    const safeName = encodeURIComponent(v.storeName);
    const newLogo = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=400`;

    await prisma.vendorProfile.update({
       where: { id: v.id },
       data: { coverUrl: newCover, logoUrl: newLogo }
    });
    console.log(`Updated Store: ${v.storeName} -> [${tags}]`);

    for (const p of v.products) {
        let pTags = tags;
        const pName = p.name.toLowerCase();
        
        // Granular Product Tags
        if (pName.includes('shoe') || pName.includes('boot')) pTags = 'shoes,footwear';
        else if (pName.includes('dress') || pName.includes('shirt')) pTags = 'clothing,shirt';
        else if (pName.includes('apple') || pName.includes('iphone') || pName.includes('mac')) pTags = 'apple,laptop,smartphone';
        else if (pName.includes('pill') || pName.includes('vitamin') || pName.includes('syrup')) pTags = 'pills,medicine';
        else if (pName.includes('drill') || pName.includes('wrench')) pTags = 'tools,hardware';
        else if (pName.includes('meat') || pName.includes('chicken') || pName.includes('burger')) pTags = 'meat,burger,food';
        
        globalIdCounter++;
        const newProductImg = `https://loremflickr.com/600/600/${pTags}/all?lock=${globalIdCounter}`;
        
        await prisma.product.update({
           where: { id: p.id },
           data: { images: newProductImg }
        });
        updatedCount++;
    }
  }

  console.log(`Database Successfully Resolved. Mapped distinct photos with no global collisions across ${updatedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
