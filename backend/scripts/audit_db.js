const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            products: true,
            vendors: true
          }
        },
        products: true,
      }
    });

    const vendors = await prisma.vendorProfile.findMany();
    const products = await prisma.product.findMany();

    const report = {
      categories: categories.map(cat => {
        const catVendorIds = new Set();
        const catProductCount = cat.products.length;
        
        cat.products.forEach(p => catVendorIds.add(p.vendorId));

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          productsCount: catProductCount,
          vendorsCount: catVendorIds.size,
          subcategories: cat.subcategories.map(sub => {
            const subVendorIds = new Set();
            sub.products.forEach(p => subVendorIds.add(p.vendorId));
            
            return {
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              productsCount: sub.products.length,
              vendorsCount: subVendorIds.size
            };
          })
        };
      }),
      totalVendors: vendors.length,
      totalProducts: products.length
    };

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Error during audit:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
