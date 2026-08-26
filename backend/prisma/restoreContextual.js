const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const https = require('https');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const checkUrl = (url) => new Promise((resolve) => {
    https.get(url, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 302);
    }).on('error', () => resolve(false));
});

const defaultValidUnsplash = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&fit=crop', // Supermarket Aisle
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&fit=crop', // Laptop desk
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&fit=crop', // Doctor
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&fit=crop', // Medicine
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&fit=crop',   // Food
];

function getRandomValid() {
    return defaultValidUnsplash[Math.floor(Math.random() * defaultValidUnsplash.length)];
}

async function main() {
  console.log("Restoring Handpicked Contextual Database (Filtered via HTTP Heads)...");

  // Read exactly from seedPlatform logic but bypass the local DB directly.
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, 'seedPlatform.js'), 'utf8');
  
  // Extract catalogTemplate dynamically via eval (safe inside this controlled script)
  const regex = /const catalogTemplate = \[([\s\S]*?)\];/;
  let match = code.match(regex);
  if (!match) {
    console.error("Could not parse catalogTemplate from seedPlatform.js");
    process.exit(1);
  }
  
  let catalogTemplate;
  eval(`catalogTemplate = [${match[1]}];`);

  for (const catBlock of catalogTemplate) {
    for (const vData of catBlock.vendors) {
      if (vData.name === 'mamaebo') continue;
      
      const vProfile = await prisma.vendorProfile.findFirst({ where: { storeName: vData.name } });
      if (vProfile) {
          // Check coverUrl
          let validCover = vData.img;
          if (validCover.includes('unsplash.com')) {
              let isOk = await checkUrl(validCover);
              if (!isOk) validCover = getRandomValid();
          }

          let validLogo = vData.logo;
          if (validLogo.includes('unsplash.com')) {
              let isOk = await checkUrl(validLogo);
              if (!isOk) validLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(vData.name)}&background=random&color=fff&size=400`;
          }

          await prisma.vendorProfile.update({
             where: { id: vProfile.id },
             data: { coverUrl: validCover, logoUrl: validLogo }
          });
          console.log(`Re-mapped Valid Cover for Vendor: ${vData.name}`);

          for (const p of vData.products) {
              const exP = await prisma.product.findFirst({ where: { vendorId: vProfile.id, name: p.name }});
              if (exP) {
                  let validPImg = p.img;
                  if (validPImg.includes('unsplash.com')) {
                      let isOk = await checkUrl(validPImg);
                      if (!isOk) validPImg = validCover; // Fallback to store cover if product img fails
                  }
                  await prisma.product.update({
                      where: { id: exP.id },
                      data: { images: validPImg }
                  });
              }
          }
      }
    }
  }

  // Also clean up any loose users that were affected by Picsum but aren't in SeedTemplate (Legacy users)
  const allVendors = await prisma.vendorProfile.findMany({ include: { products: true }});
  for (const v of allVendors) {
     if (v.coverUrl.includes('picsum.photos')) {
         const newCover = getRandomValid();
         await prisma.vendorProfile.update({ where: {id: v.id}, data: {coverUrl: newCover}});
         for (const p of v.products) {
             if (p.images.includes('picsum.photos')) {
                 await prisma.product.update({ where: {id: p.id}, data: {images: newCover}});
             }
         }
     }
  }

  console.log("Restoration Complete: All Random Picsum replaced Contextually!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
