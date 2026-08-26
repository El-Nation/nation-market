import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const p = await prisma.product.findFirst({ where: { name: { contains: 'Teddy' } } });
  console.log("Teddy data:", p);

  // Also manually test if we can update it
  if (p) {
     const updated = await prisma.product.update({
       where: { id: p.id },
       data: { images: "https://loremflickr.com/600/600/teddy?lock=999" }
     });
     console.log("Updated Teddy:", updated);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
