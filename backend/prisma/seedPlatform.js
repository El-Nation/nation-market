"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting Seeding Process...");
    // 1. CLEAR EXISTING MOCK DATA TO AVOID DUPLICATES (Carefully)
    // NOT clearing users to preserve admin/dev accounts. We will use unique emails for mock data.
    const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
    // 2. DEFINE MASTER CATEGORIES & SUBCATEGORIES
    const catalogTemplate = [
        {
            category: 'Restaurants',
            icon: 'Utensils',
            subs: ['Fast Food', 'Local Dishes', 'Intercontinental', 'Vegan'],
            vendors: [
                { name: 'KFC Branch', sub: 'Fast Food', desc: 'World famous fried chicken.', img: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1628268595461-2d7088b48679?w=400&fit=crop' },
                { name: 'Iya Basira Eatery', sub: 'Local Dishes', desc: 'Home standard Amala and Ewedu.', img: 'https://images.unsplash.com/photo-1528699633788-424224dc89b5?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&fit=crop' },
                { name: 'Green Life Cafe', sub: 'Vegan', desc: '100% Organic and healthy bowls.', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&fit=crop' }
            ]
        },
        {
            category: 'Supermarkets',
            icon: 'ShoppingCart',
            subs: ['Groceries', 'Beverages', 'Toiletries'],
            vendors: [
                { name: 'Spar Market', sub: 'Groceries', desc: 'Fresh groceries direct to you.', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&fit=crop' },
                { name: 'Shoprite Connect', sub: 'Beverages', desc: 'All your household beverages.', img: 'https://images.unsplash.com/photo-1573482470716-e41c4f5acc9c?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&fit=crop' },
                { name: 'Everyday Supermart', sub: 'Toiletries', desc: 'Personal care and beauty.', img: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&fit=crop' }
            ]
        },
        {
            category: 'Pharmacies',
            icon: 'Pill',
            subs: ['Prescription', 'Supplements', 'Baby Care'],
            vendors: [
                { name: 'MedPlus Online', sub: 'Supplements', desc: 'Quality vitamins and minerals.', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&fit=crop' },
                { name: 'HealthPlus Pharmacy', sub: 'Prescription', desc: 'Registered pharmaceutical distribution.', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&fit=crop' },
                { name: 'Nett Pharmacy', sub: 'Baby Care', desc: 'Baby formulas and wellness.', img: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=400&fit=crop' }
            ]
        },
        {
            category: 'Fashion',
            icon: 'Shirt',
            subs: ['Mens Wear', 'Womens Wear', 'Shoes', 'Accessories'],
            vendors: [
                { name: 'Zara Boutique', sub: 'Womens Wear', desc: 'Trendy modern apparel.', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&fit=crop' },
                { name: 'Nike Standard', sub: 'Shoes', desc: 'Genuine sportswear and sneakers.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&fit=crop' },
                { name: 'Lagos Tailors', sub: 'Mens Wear', desc: 'Bespoke suits and traditional.', img: 'https://images.unsplash.com/photo-1594938298598-7090b8f3e589?w=600&fit=crop', logo: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&fit=crop' }
            ]
        }
    ];
    for (const catBlock of catalogTemplate) {
        // A. Upsert Category
        const category = await prisma.category.upsert({
            where: { slug: catBlock.category.toLowerCase().replace(/ /g, '-') },
            update: {},
            create: {
                name: catBlock.category,
                slug: catBlock.category.toLowerCase().replace(/ /g, '-'),
                icon: catBlock.icon,
                isActive: true,
            }
        });
        console.log(`- Seeded Category: ${category.name}`);
        // B. Upsert Subcategories
        const subMap = new Map();
        for (const sub of catBlock.subs) {
            const subcategory = await prisma.subcategory.upsert({
                where: { slug: sub.toLowerCase().replace(/ /g, '-') },
                update: { categoryId: category.id },
                create: {
                    name: sub,
                    slug: sub.toLowerCase().replace(/ /g, '-'),
                    categoryId: category.id,
                    isActive: true
                }
            });
            subMap.set(sub, subcategory.id);
        }
        // C. Create Vendors directly mapped to Category & Subcategories
        let idx = 1;
        for (const vData of catBlock.vendors) {
            const userEmail = `${vData.name.replace(/ /g, '').toLowerCase()}@vendor.com`;
            // UPSERT THE VENDOR USER
            const user = await prisma.user.upsert({
                where: { email: userEmail },
                update: {},
                create: {
                    email: userEmail,
                    password: hashedPassword,
                    firstName: vData.name.split(' ')[0],
                    lastName: vData.name.split(' ')[1] || 'Shop',
                    role: 'VENDOR',
                    isEmailVerified: true
                }
            });
            // UPSERT THE VENDOR PROFILE + CONNECT TO CATALOG
            const vProfile = await prisma.vendorProfile.upsert({
                where: { userId: user.id },
                update: {
                    storeName: vData.name,
                    description: vData.desc,
                    coverUrl: vData.img,
                    logoUrl: vData.logo,
                    subcategories: { set: [{ id: subMap.get(vData.sub) }] }
                },
                create: {
                    userId: user.id,
                    businessName: vData.name,
                    businessType: category.name,
                    storeName: vData.name,
                    description: vData.desc,
                    coverUrl: vData.img,
                    logoUrl: vData.logo,
                    address: '123 Market Hub Avenue',
                    isApproved: true,
                    setupComplete: true,
                    subcategories: {
                        connect: [{ id: subMap.get(vData.sub) }]
                    }
                }
            });
            console.log(`  └─ Seeded Vendor: ${vData.name} -> ${vData.sub}`);
            // D. Create at least 3 Products per vendor
            const mockProducts = [
                { name: `${vData.name} Basic Item`, price: 1500, img: vData.img },
                { name: `${vData.name} Standard Item`, price: 4500, img: vData.img },
                { name: `${vData.name} Premium Box`, price: 9500, img: vData.img }
            ];
            for (const p of mockProducts) {
                // Find existing to prevent huge duplicates if ran twice
                const exP = await prisma.product.findFirst({ where: { vendorId: vProfile.id, name: p.name } });
                if (!exP) {
                    await prisma.product.create({
                        data: {
                            vendorId: vProfile.id,
                            categoryId: category.id,
                            subcategoryId: subMap.get(vData.sub),
                            name: p.name,
                            description: `A fine product by ${vData.name}.`,
                            price: p.price,
                            inventory: 50,
                            isAvailable: true,
                            images: p.img // fallback image
                        }
                    });
                }
            }
            idx++;
        }
    }
    console.log("Successfully seeded the Storefront Categories, Subcategories, and Vendors!");
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedPlatform.js.map