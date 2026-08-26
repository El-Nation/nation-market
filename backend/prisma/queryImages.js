const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const subcats = await prisma.subcategory.findMany({ select: { name: true, image: true, slug: true } });
  console.log('--- Subcategories ---');
  subcats.forEach(s => console.log(`${s.name}: ${s.image}`));

  const products = await prisma.product.findMany({ take: 5, select: { name: true, images: true } });
  console.log('\n--- Sample Products ---');
  products.forEach(p => console.log(`${p.name}: ${p.images}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
