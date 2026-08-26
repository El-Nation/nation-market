const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const { createClient } = require('redis');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function getSemanticKeywords(name) {
  const norm = name.toLowerCase();
  if (norm.includes('nursing') || norm.includes('breast') || norm.includes('maternity') || norm.includes('bra')) return 'maternity';
  if (norm.includes('bear') || norm.includes('lego') || norm.includes('toy') || norm.includes('doll')) return 'toy';
  if (norm.includes('pump') || norm.includes('baby') || norm.includes('diaper')) return 'baby';
  if (norm.includes('shoe') || norm.includes('sneaker') || norm.includes('boot')) return 'shoe';
  if (norm.includes('phone') || norm.includes('laptop') || norm.includes('gadget') || norm.includes('charger')) return 'gadget';
  if (norm.includes('beef') || norm.includes('chicken') || norm.includes('food') || norm.includes('rice') || norm.includes('canned')) return 'food';
  if (norm.includes('shirt') || norm.includes('pants') || norm.includes('jeans') || norm.includes('jacket')) return 'clothes';
  if (norm.includes('chair') || norm.includes('table') || norm.includes('sofa') || norm.includes('bed')) return 'furniture';
  if (norm.includes('drill') || norm.includes('hammer') || norm.includes('tool') || norm.includes('auto')) return 'tool';
  // Fallback broad keyword
  let firstWord = norm.replace(/[^a-z]/g, ' ').trim().split(' ')[0] || 'product';
  return firstWord.length > 2 ? firstWord : 'product';
}

function getFlickrUrl(name) {
  const keyword = getSemanticKeywords(name);
  const lock = Math.floor(Math.random() * 5000) + 1; // 1 to 5000 to ensure variance
  return `https://loremflickr.com/600/600/${encodeURIComponent(keyword)}?lock=${lock}`;
}

async function main() {
  console.log('--- Force Patching Images using Semantic Mapping ---');
  
  const subcats = await prisma.subcategory.findMany();
  for (const s of subcats) {
    const newUrl = getFlickrUrl(s.name);
    await prisma.subcategory.update({ where: { id: s.id }, data: { image: newUrl } });
  }
  
  const products = await prisma.product.findMany();
  for (const p of products) {
    const newUrl = getFlickrUrl(p.name);
    await prisma.product.update({ where: { id: p.id }, data: { images: newUrl } });
  }
  
  console.log(`Successfully forced patched ${subcats.length} subcats and ${products.length} products.`);

  try {
     const redis = createClient({ url: 'redis://localhost:6379' });
     await redis.connect();
     await redis.flushAll();
     await redis.disconnect();
     console.log('Redis cache flushed.');
  } catch (err) {
     console.error('Redis flush bypassed (expected if server was manually rebooted).');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
