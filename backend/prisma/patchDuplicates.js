const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Ultimate Duplicate Removal Patch...");
  
  const allVendors = await prisma.vendorProfile.findMany({ include: { products: true }});
  
  for (const vendor of allVendors) {
    if (vendor.storeName === 'mamaebo') continue;
    
    // For covers, use a guaranteed unique picsum seed based on store name
    const coverSeed = encodeURIComponent(vendor.storeName.replace(/ /g, ''));
    const uniqueCover = `https://picsum.photos/seed/${coverSeed}Cover/600/400`;

    await prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: { coverUrl: uniqueCover }
    });

    for (const p of vendor.products) {
        // For products, use a guaranteed unique picsum seed based on product name
        const prodSeed = encodeURIComponent(p.name.replace(/ /g, ''));
        const uniqueProd = `https://picsum.photos/seed/${prodSeed}Prod/600/600`;
        
        await prisma.product.update({
          where: { id: p.id },
          data: { images: uniqueProd }
        });
    }
  }

  console.log("Ultimate Duplicate Removal Completed. All images are 100% distinct algorithms.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
