import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Subcategories ---");
  const subcats = await prisma.subcategory.findMany();
  for (const s of subcats) {
    console.log(`[${s.id}] ${s.name}: ${s.image}`);
  }

  console.log("\n--- Products with 'ui-avatars' or identical placeholders ---");
  const products = await prisma.product.findMany();
  for (const p of products) {
    if (!p.images || p.images.includes('ui-avatars.com') || p.images.includes('BN') || p.images.includes('loremflickr')) {
      console.log(`[${p.id}] ${p.name}: ${p.images}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
