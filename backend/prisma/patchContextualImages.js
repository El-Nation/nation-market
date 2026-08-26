const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function needsPatching(imageUrl) {
  if (!imageUrl) return true;
  return imageUrl.includes('ui-avatars.com') ||
         imageUrl.includes('BN') ||
         (imageUrl.includes('loremflickr.com') && !imageUrl.includes('lock=')) ||
         imageUrl.trim() === '';
}

function getFlickrUrl(name) {
  // Convert "Stuffed Teddy Bear" to "Stuffed,Teddy,Bear"
  let cleanWords = name.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/).slice(0, 3).join(',');
  if (!cleanWords) cleanWords = 'product';
  const lock = Math.floor(Math.random() * 1000000);
  return `https://loremflickr.com/600/600/${encodeURIComponent(cleanWords)}?lock=${lock}`;
}

async function main() {
  console.log('--- Starting Flickr Contextual Image Patch ---');
  
  // 1. Subcategory patch
  const subcats = await prisma.subcategory.findMany();
  let subPatchCount = 0;
  for (const s of subcats) {
    if (needsPatching(s.image)) {
      const newUrl = getFlickrUrl(s.name);
      try {
        await prisma.subcategory.update({
          where: { id: s.id },
          data: { image: newUrl }
        });
        subPatchCount++;
      } catch (err) {
        console.error("Subcat Error on", s.name, ":", err.message);
      }
    }
  }
  
  // 2. Products patch
  const products = await prisma.product.findMany();
  let prodPatchCount = 0;
  for (const p of products) {
    if (needsPatching(p.images)) {
      const newUrl = getFlickrUrl(p.name);
      try {
        await prisma.product.update({
          where: { id: p.id },
          data: { images: newUrl }
        });
        prodPatchCount++;
      } catch (err) {
        console.error("Product Error on", p.name, ":", err.message);
      }
    }
  }
  
  console.log(`Successfully patched:
Subcategories: ${subPatchCount}
Products: ${prodPatchCount}
--- Finished ---`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
