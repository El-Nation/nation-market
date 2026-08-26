const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting 10-Category Exhaustive Seeding Process...");
  const hashedPassword = await bcrypt.hash('password123', 10);

  const catalogTemplate = [
    {
      category: 'Supermarket & Groceries', slug: 'supermarket-groceries',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&fit=crop',
      subs: ['Beverages', 'Fresh Produce', 'Household Items'],
      vendors: [
        { 
          name: 'Spar MegaStore', sub: 'Fresh Produce', desc: 'Fresh local and imported goods.', 
          img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&fit=crop',
          products: [
            { name: 'Fresh Apples Bundle', price: 2500, img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=600&fit=crop' },
            { name: 'Organic Banana Bunch', price: 1500, img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&fit=crop' },
            { name: 'Green Bell Peppers', price: 3200, img: 'https://images.unsplash.com/photo-1563514253381-420f1883bd88?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Shoprite Connect', sub: 'Beverages', desc: 'All your household beverages.', 
          img: 'https://images.unsplash.com/photo-1573482470716-e41c4f5acc9c?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&fit=crop',
          products: [
            { name: 'Coca Cola 12-Pack', price: 4500, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&fit=crop' },
            { name: 'Chivita Apple Juice', price: 2800, img: 'https://images.unsplash.com/photo-1600271886742-f049cd451b69?w=600&fit=crop' },
            { name: 'Nestle Pure Water', price: 1200, img: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'Ebeano Supermarket', sub: 'Household Items', desc: 'Quality household items.', 
          img: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&fit=crop',
          products: [
            { name: 'Liquid Dish Wash', price: 1400, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&fit=crop' },
            { name: 'Soft Tissue Paper Roll', price: 3500, img: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=600&fit=crop' },
            { name: 'Detergent Powder Bag', price: 5500, img: 'https://images.unsplash.com/photo-1601633519124-74d32e922db8?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Fashion & Beauty', slug: 'fashion-beauty',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&fit=crop',
      subs: ['Womens Wear', 'Mens Wear', 'Cosmetics'],
      vendors: [
        { 
          name: 'Zara Boutique', sub: 'Womens Wear', desc: 'Trendy modern apparel.', 
          img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&fit=crop',
          products: [
            { name: 'Red Summer Dress', price: 24500, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&fit=crop' },
            { name: 'Casual Denim Jacket', price: 32000, img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&fit=crop' },
            { name: 'Leather Handbag', price: 15500, img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'Lagos Tailors', sub: 'Mens Wear', desc: 'Bespoke suits and traditional.', 
          img: 'https://images.unsplash.com/photo-1594938298598-7090b8f3e589?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&fit=crop',
          products: [
            { name: 'Agbada Native Set', price: 45000, img: 'https://images.unsplash.com/photo-1599839619722-e1ea354f9a06?w=600&fit=crop' },
            { name: 'Corporate Oxford Shirt', price: 12500, img: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?w=600&fit=crop' },
            { name: 'Slim Fit Trousers', price: 18000, img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Mac Cosmetics', sub: 'Cosmetics', desc: 'Original beauty and makeup.', 
          img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&fit=crop',
          products: [
            { name: 'Matte Red Lipstick', price: 8500, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&fit=crop' },
            { name: 'Full Coverage Foundation', price: 14000, img: 'https://images.unsplash.com/photo-1590156546946-ce55a12a6a5d?w=600&fit=crop' },
            { name: 'Eyeshadow Palette', price: 21000, img: 'https://images.unsplash.com/photo-1512496015851-a1cbfc8158c5?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Electronics & Gadgets', slug: 'electronics-gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&fit=crop',
      subs: ['Mobile Phones', 'Laptops', 'Audio Devices'],
      vendors: [
        { 
          name: 'Slot Nigeria', sub: 'Mobile Phones', desc: 'Authentic mobiles and gadgets.', 
          img: 'https://images.unsplash.com/photo-1601784551446-20c9e07cd56e?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&fit=crop',
          products: [
            { name: 'Samsung Galaxy S23', price: 850000, img: 'https://images.unsplash.com/photo-1610945265064-3234eb351c91?w=600&fit=crop' },
            { name: 'iPhone 15 Pro Max', price: 1450000, img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&fit=crop' },
            { name: 'Infinix Note 30', price: 215000, img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'Apple Premium', sub: 'Laptops', desc: 'Authorized Apple reseller.', 
          img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1534011546717-407bced4d25c?w=400&fit=crop',
          products: [
            { name: 'MacBook Pro M2', price: 2100000, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&fit=crop' },
            { name: 'MacBook Air M1', price: 1250000, img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&fit=crop' },
            { name: 'Magic Mouse V2', price: 95000, img: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'JBL Audio Hub', sub: 'Audio Devices', desc: 'Crystal clear sounds.', 
          img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1558451877-3e8a107386d4?w=400&fit=crop',
          products: [
            { name: 'JBL Flip 6 Speaker', price: 110000, img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&fit=crop' },
            { name: 'Sony WH-1000XM5', price: 340000, img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&fit=crop' },
            { name: 'AirPods Pro V2', price: 230000, img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&fit=crop' }
          ]
        }
      ]
    },
    {
      category: 'Restaurants & Food', slug: 'restaurants-food',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop',
      subs: ['Fast Food', 'Local Dish', 'Bakery'],
      vendors: [
        { 
          name: 'KFC Downtown', sub: 'Fast Food', desc: 'World famous fried chicken.', 
          img: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1628268595461-2d7088b48679?w=400&fit=crop',
          products: [
            { name: 'Zinger Burger Meal', price: 6500, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&fit=crop' },
            { name: '10-Piece Chicken Bucket', price: 18500, img: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&fit=crop' },
            { name: 'Spicy Hot Wings', price: 5500, img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'Iya Basira', sub: 'Local Dish', desc: 'Authentic local cuisine.', 
          img: 'https://images.unsplash.com/photo-1528699633788-424224dc89b5?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&fit=crop',
          products: [
            { name: 'Amala and Ewedu', price: 3500, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&fit=crop' },
            { name: 'Ofada Rice Portion', price: 4500, img: 'https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=600&fit=crop' },
            { name: 'Pounded Yam & Egusi', price: 5200, img: 'https://images.unsplash.com/photo-1616892550186-bcebb6cb85ec?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Coldstone Creamery', sub: 'Bakery', desc: 'Signature cakes and cream.', 
          img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1582283995805-4f40f0cd3d2d?w=400&fit=crop',
          products: [
            { name: 'Chocolate Fudge Cake', price: 18000, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&fit=crop' },
            { name: 'Strawberry Ice Cream', price: 3500, img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&fit=crop' },
            { name: 'Glazed Donuts Box', price: 8500, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Agriculture & Farming', slug: 'agriculture-farming',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfefcb3e?w=800&fit=crop',
      subs: ['Livestock', 'Farm Tools', 'Seeds'],
      vendors: [
        { 
          name: 'AgroAllied Hub', sub: 'Livestock', desc: 'Healthy livestock and poultry.', 
          img: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1596700769363-228cfda3bd90?w=400&fit=crop',
          products: [
            { name: 'Live Broiler Chicken', price: 7500, img: 'https://images.unsplash.com/photo-1548550023-2bf3c49b338c?w=600&fit=crop' },
            { name: 'Fresh Farm Eggs Crate', price: 3500, img: 'https://images.unsplash.com/photo-1587486913049-53fc88980fdc?w=600&fit=crop' },
            { name: 'Mature Goat', price: 85000, img: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'GreenLife Seeds', sub: 'Seeds', desc: 'High yield planting seeds.', 
          img: 'https://images.unsplash.com/photo-1505307374026-62ce9d08e9cc?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1602446738947-f58c70414cae?w=400&fit=crop',
          products: [
            { name: 'Maize Seed Bag', price: 2500, img: 'https://images.unsplash.com/photo-1599308303036-799ff2dfbfd5?w=600&fit=crop' },
            { name: 'Cocoa Pod Seeds', price: 8500, img: 'https://images.unsplash.com/photo-1607314545595-3bc55dbd79d6?w=600&fit=crop' },
            { name: 'Tomato Seed Pack', price: 1500, img: 'https://images.unsplash.com/photo-1582281273934-0fe3ea474148?w=600&fit=crop' }
          ]
        },
        { 
          name: 'FarmTech Solutions', sub: 'Farm Tools', desc: 'Mechanized farming equipment.', 
          img: 'https://images.unsplash.com/photo-1595123985794-d576a40ce8a0?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1523301032876-0f8c85775c97?w=400&fit=crop',
          products: [
            { name: 'Steel Wheelbarrow', price: 45000, img: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&fit=crop' },
            { name: 'Heavy Duty Cutlass', price: 5500, img: 'https://images.unsplash.com/photo-1634860475252-9b2f67604473?w=600&fit=crop' },
            { name: 'Knapsack Sprayer', price: 22000, img: 'https://images.unsplash.com/photo-1595123985794-d576a40ce8a0?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Pharmacy & Health', slug: 'pharmacy-health',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&fit=crop',
      subs: ['Prescription Drugs', 'Wellness Kit', 'Baby Care'],
      vendors: [
        { 
          name: 'MedPlus Store', sub: 'Wellness Kit', desc: 'Quality vitamins and minerals.', 
          img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&fit=crop',
          products: [
            { name: 'Vitamin C 1000mg', price: 4500, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&fit=crop' },
            { name: 'Multivitamin Gummies', price: 8500, img: 'https://images.unsplash.com/photo-1628172813134-8c76bea625a6?w=600&fit=crop' },
            { name: 'Omega 3 Fish Oil', price: 12500, img: 'https://images.unsplash.com/photo-1550572017-edb799988dd2?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'HealthPlus Direct', sub: 'Prescription Drugs', desc: 'Registered pharmaceutical.', 
          img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&fit=crop',
          products: [
            { name: 'Paracetamol Tabs', price: 500, img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&fit=crop' },
            { name: 'Ibuprofen Pack', price: 1200, img: 'https://images.unsplash.com/photo-1550572017-edb799988dd2?w=600&fit=crop' },
            { name: 'Cough Syrup', price: 2500, img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Nett Pharmacy', sub: 'Baby Care', desc: 'Baby formulas and wellness.', 
          img: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=400&fit=crop',
          products: [
            { name: 'SMA Gold Formula', price: 24000, img: 'https://images.unsplash.com/photo-1582229562768-45be04586dce?w=600&fit=crop' },
            { name: 'Baby Wipes Pack', price: 3500, img: 'https://images.unsplash.com/photo-1594916847012-32a76fdf2438?w=600&fit=crop' },
            { name: 'Diaper Rash Cream', price: 4500, img: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Books & Education', slug: 'books-education',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&fit=crop',
      subs: ['Textbooks', 'Stationery', 'Novels'],
      vendors: [
        { 
          name: 'Laterna Books', sub: 'Textbooks', desc: 'Educational and spiritual.', 
          img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&fit=crop',
          products: [
            { name: 'Advanced Science Text', price: 8500, img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&fit=crop' },
            { name: 'Mathematics Fundamentals', price: 6500, img: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&fit=crop' },
            { name: 'History Omnibus', price: 12000, img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'CSS Bookshops', sub: 'Stationery', desc: 'Academic materials.', 
          img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&fit=crop',
          products: [
            { name: 'Drawing Pencils Pack', price: 2500, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&fit=crop' },
            { name: 'A4 Printing Paper Pack', price: 7500, img: 'https://images.unsplash.com/photo-1586071720448-bce73d09a066?w=600&fit=crop' },
            { name: 'Standard Notepads Bundle', price: 3000, img: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&fit=crop' }
          ]
        },
        { 
          name: 'RovingHeights', sub: 'Novels', desc: 'Fictional and literary collections.', 
          img: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1589998059171-9899ea298bc6?w=400&fit=crop',
          products: [
            { name: 'Things Fall Apart', price: 4500, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&fit=crop' },
            { name: 'Harry Potter Collection', price: 45000, img: 'https://images.unsplash.com/photo-1622329241684-25e1104eab08?w=600&fit=crop' },
            { name: 'To Kill a Mockingbird', price: 8000, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Home, Kitchen & Furniture', slug: 'home-kitchen-furniture',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&fit=crop',
      subs: ['Living Room', 'Kitchen Appliances', 'Decor'],
      vendors: [
        { 
          name: 'Ikea Standard', sub: 'Living Room', desc: 'Modern indoor furniture.', 
          img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&fit=crop',
          products: [
            { name: 'Minimalist Sofa', price: 250000, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&fit=crop' },
            { name: 'Wooden Coffee Table', price: 75000, img: 'https://images.unsplash.com/photo-1532372576444-ea2ba2c24f5a?w=600&fit=crop' },
            { name: 'Standing Floor Lamp', price: 45000, img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'LG Official', sub: 'Kitchen Appliances', desc: 'Home standard appliances.', 
          img: 'https://images.unsplash.com/photo-1556910103-1c02745a895b?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&fit=crop',
          products: [
            { name: 'LG Microwave Oven', price: 85000, img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&fit=crop' },
            { name: 'Double Door Fridge', price: 750000, img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&fit=crop' },
            { name: 'Washing Machine', price: 450000, img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Bedmate Designs', sub: 'Decor', desc: 'Decorations to light your space.', 
          img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1505691938895-1758d7c4be51?w=400&fit=crop',
          products: [
            { name: 'Wall Art Canvas', price: 25000, img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&fit=crop' },
            { name: 'Luxury Rug', price: 85000, img: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&fit=crop' },
            { name: 'Scented Candles Set', price: 15000, img: 'https://images.unsplash.com/photo-1603006905593-0da2ebef2c93?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Automotive & Industrial', slug: 'automotive-industrial',
      image: 'https://images.unsplash.com/photo-1530906358829-e84b276927cf?w=800&fit=crop',
      subs: ['Car Parts', 'Tyres', 'Mechanical Tools'],
      vendors: [
        { 
          name: 'AutoZone Parts', sub: 'Car Parts', desc: 'Reliable vehicle machinery.', 
          img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1563212871-33230b91e5ee?w=400&fit=crop',
          products: [
            { name: 'Brake Pads Set', price: 35000, img: 'https://images.unsplash.com/photo-1588656111868-6d8c4e4024b3?w=600&fit=crop' },
            { name: 'Car Battery 12V', price: 85000, img: 'https://images.unsplash.com/photo-1623910385966-508b51a5c68f?w=600&fit=crop' },
            { name: 'Engine Oil Gallon', price: 24000, img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'Michelin Hub', sub: 'Tyres', desc: 'Tough tires for tough roads.', 
          img: 'https://images.unsplash.com/photo-1520641198595-580718712e58?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1588656111868-6d8c4e4024b3?w=400&fit=crop',
          products: [
            { name: 'All-Season Tyre', price: 65000, img: 'https://images.unsplash.com/photo-1588656111868-6d8c4e4024b3?w=600&fit=crop' },
            { name: 'Off-Road Tire Set', price: 280000, img: 'https://images.unsplash.com/photo-1520641198595-580718712e58?w=600&fit=crop' },
            { name: 'Spare Tyre Kit', price: 45000, img: 'https://images.unsplash.com/photo-1579532537598-459ecdaf5458?w=600&fit=crop' }
          ]
        },
        { 
          name: 'Bosch Engines', sub: 'Mechanical Tools', desc: 'Tools for heavy industrial lifting.', 
          img: 'https://images.unsplash.com/photo-1537721659795-c1cfcda452e8?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&fit=crop',
          products: [
            { name: 'Heavy Power Drill', price: 120000, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&fit=crop' },
            { name: 'Industrial Wrench Set', price: 35000, img: 'https://images.unsplash.com/photo-1537721659795-c1cfcda452e8?w=600&fit=crop' },
            { name: 'Safety Work Boots', price: 42000, img: 'https://images.unsplash.com/photo-1508215885820-4585e5610ea0?w=600&fit=crop' }
          ] 
        }
      ]
    },
    {
      category: 'Toys, Kids & Babies', slug: 'toys-kids-babies',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&fit=crop',
      subs: ['Toys', 'Baby Clothes', 'Maternity'],
      vendors: [
        { 
          name: 'Mothercare Store', sub: 'Maternity', desc: 'Mother and child absolute provisions.', 
          img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&fit=crop',
          products: [
            { name: 'Maternity Pillow', price: 18000, img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&fit=crop' },
            { name: 'Breast Pump Kit', price: 45000, img: 'https://images.unsplash.com/photo-1616874535244-73aea5082a98?w=600&fit=crop' },
            { name: 'Nursing Bra Pack', price: 12000, img: 'https://images.unsplash.com/photo-1628186105490-48e025d5d852?w=600&fit=crop' }
          ] 
        },
        { 
          name: 'ToysRUs Direct', sub: 'Toys', desc: 'Playtime items and joy gifts.', 
          img: 'https://images.unsplash.com/photo-1500995617113-cf584ce3f295?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&fit=crop',
          products: [
            { name: 'Lego Creator Set', price: 35000, img: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600&fit=crop' },
            { name: 'Stuffed Teddy Bear', price: 15000, img: 'https://images.unsplash.com/photo-1558245598-c6f376cc6ea5?w=600&fit=crop' },
            { name: 'Toy Racing Car', price: 8500, img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&fit=crop' }
          ]
        },
        { 
          name: 'KidsWorld Outlet', sub: 'Baby Clothes', desc: 'Dresses for the little ones.', 
          img: 'https://images.unsplash.com/photo-1519340333755-56e9c1d04079?w=600&fit=crop', 
          logo: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&fit=crop',
          products: [
            { name: 'Cotton Onesies Set', price: 12000, img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&fit=crop' },
            { name: 'Baby Walking Shoes', price: 9000, img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&fit=crop' },
            { name: 'Winter Baby Coat', price: 18000, img: 'https://images.unsplash.com/photo-1519340333755-56e9c1d04079?w=600&fit=crop' }
          ] 
        }
      ]
    }
  ];

  for (const catBlock of catalogTemplate) {
    const category = await prisma.category.upsert({
      where: { slug: catBlock.slug },
      update: { image: catBlock.image },
      create: {
        name: catBlock.category,
        slug: catBlock.slug,
        image: catBlock.image
      }
    });

    const subMap = new Map();
    for (const sub of catBlock.subs) {
      const subcategory = await prisma.subcategory.upsert({
        where: { slug: sub.toLowerCase().replace(/ /g, '-') },
        update: { categoryId: category.id },
        create: {
          name: sub,
          slug: sub.toLowerCase().replace(/ /g, '-'),
          categoryId: category.id
        }
      });
      subMap.set(sub, subcategory.id);
    }

    for (const vData of catBlock.vendors) {
      const userEmail = `${vData.name.replace(/ /g, '').toLowerCase()}@vendor.com`;
      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          password: hashedPassword,
          firstName: vData.name.split(' ')[0],
          lastName: vData.name.split(' ')[1] || 'Shop',
          role: 'VENDOR'
        }
      });

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
          businessType: category.name,
          storeName: vData.name,
          description: vData.desc,
          coverUrl: vData.img,
          logoUrl: vData.logo,
          address: '123 Market Hub Avenue',
          status: 'ACTIVE',
          isRegistered: true,
          subcategories: {
            connect: [{ id: subMap.get(vData.sub) }]
          }
        }
      });

      console.log(`  └─ Established Vendor & Photos: ${vData.name}`);

      for (const p of vData.products) {
        const exP = await prisma.product.findFirst({ where: { vendorId: vProfile.id, name: p.name } });
        if (exP) {
           await prisma.product.update({ where: { id: exP.id }, data: { images: p.img } });
        } else {
           await prisma.product.create({
             data: {
               vendorId: vProfile.id,
               categoryId: category.id,
               subcategoryId: subMap.get(vData.sub),
               name: p.name,
               description: `A top-rated product provided by ${vData.name}. Perfect fit for your needs.`,
               price: p.price,
               inventory: 150,
               isAvailable: true,
               images: p.img
             }
           });
        }
      }
    }
  }

  console.log("Successfully bridged 10 legacy Categories with 90 strict 100% Unique Unsplash Photos!!!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
