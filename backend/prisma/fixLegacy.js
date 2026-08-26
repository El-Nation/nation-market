const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning legacy picsum hooks...");
  const allVendors = await prisma.vendorProfile.findMany({ include: { products: true }});
  
  for (const v of allVendors) {
     if (v.coverUrl && v.coverUrl.includes('picsum.photos')) {
         const newCover = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&fit=crop';
         await prisma.vendorProfile.update({ where: {id: v.id}, data: {coverUrl: newCover}});
     }
     
     if (v.logoUrl && v.logoUrl.includes('picsum.photos')) {
         const newLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.storeName)}&background=random&color=fff&size=400`;
         await prisma.vendorProfile.update({ where: {id: v.id}, data: {logoUrl: newLogo}});
     }

     for (const p of v.products) {
         if (p.images && p.images.includes('picsum.photos')) {
             await prisma.product.update({ where: {id: p.id}, data: {images: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&fit=crop'}});
         }
     }
  }

  console.log("Legacy DB Cleaned Successfully.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
