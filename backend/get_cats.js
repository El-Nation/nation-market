const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const cats = await prisma.category.findMany({ include: { subcategories: true }});
  console.log("Categories:", cats.length);
  let subCount = 0;
  cats.forEach(c => {
    subCount += c.subcategories.length;
    console.log(c.name, '-', c.subcategories.map(s => s.name).join(', '));
  });
  console.log("Total Subcategories:", subCount);
}
run().then(() => prisma.$disconnect());
