import { prisma } from '../src/prisma';

const PRODUCT_DATA: Record<string, any[]>  = {
  // Agriculture
  "Grains, Beans & Nuts": [
    { name: "Oloyin Sweet Beans (1 Painter)", price: 4500, label: "beans,food" },
    { name: "Premium Ofada Rice (5kg)", price: 15000, label: "rice,grain" },
    { name: "Raw Cashew Nuts (1kg)", price: 6500, label: "cashew,nuts" },
    { name: "Garri Ijebu (1 Painter)", price: 2500, label: "cassava,garri" }
  ],
  "Tubers & Roots": [
    { name: "Large Abuja Yam Tuber", price: 3500, label: "yam,tuber" },
    { name: "Sweet Potatoes (Half Basket)", price: 5000, label: "sweetpotatoes,farm" },
    { name: "Fresh Cassava Bundles", price: 2000, label: "cassava,farm" }
  ],
  "Fruits & Vegetables": [
    { name: "Fresh Roma Tomatoes (Basket)", price: 8000, label: "tomatoes,vegetable" },
    { name: "Jos Apples (1 Dozen)", price: 4000, label: "apple,fruit" },
    { name: "Fluted Pumpkin Leaves (Ugu)", price: 1000, label: "uguleaves,vegetables" },
    { name: "Ripe Plantain (Large Bunch)", price: 3500, label: "plantain,fruit" }
  ],
  "Livestock & Poultry": [
    { name: "Live Broiler Chicken (2.5kg)", price: 9500, label: "chicken,poultry" },
    { name: "Crate of Large Brown Eggs", price: 4200, label: "eggs,poultry" },
    { name: "Live Goat (Medium Size)", price: 65000, label: "goat,livestock" }
  ],
  "Spices & Seasonings": [
    { name: "Dried Cameroon Pepper (Derica)", price: 3000, label: "pepper,spice" },
    { name: "Knorr Chicken Cubes (Pack)", price: 2500, label: "seasoning,food" },
    { name: "Locust Beans / Iru (Cup)", price: 1500, label: "locustbeans,spice" }
  ],
  "Fish & Seafood": [
    { name: "Fresh Catfish (Per Kg)", price: 3500, label: "catfish,fish" },
    { name: "Smoked Titus Fish", price: 2000, label: "smokedfish,food" },
    { name: "Jumbo Prawns (1kg Box)", price: 8500, label: "prawns,seafood" }
  ],
  "Farming Tools": [
    { name: "Heavy Duty Cutlass / Machete", price: 3000, label: "cutlass,tools" },
    { name: "Gardening Hoe", price: 2500, label: "hoe,farming" },
    { name: "Wheelbarrow", price: 25000, label: "wheelbarrow,tools" }
  ],
  
  // Fast Food & Restaurant
  "Fast Food": [
    { name: "Large Pepperoni Pizza", price: 8500, label: "pizza,fastfood" },
    { name: "Chicken Shawarma + Double Sausage", price: 4500, label: "shawarma,food" },
    { name: "Beef Burger with French Fries", price: 6500, label: "burger,fastfood" },
    { name: "Deep Fried Chicken Wings (6pcs)", price: 4000, label: "chickenwings,fastfood" }
  ],
  "Local Dishes": [
    { name: "Amala & Ewedu with Assorted Meat", price: 3500, label: "amala,nigerianfood" },
    { name: "Pounded Yam & Egusi Soup", price: 4500, label: "poundedyam,soup" },
    { name: "Delta Banga Soup (1 Litre Bowl)", price: 7000, label: "bangasoup,food" },
    { name: "Jollof Rice & Fried Turkey", price: 4500, label: "jollofrice,food" }
  ],
  "Pastries & Cakes": [
    { name: "Red Velvet Cake (8 Inch)", price: 18000, label: "redvelvetcake,cake" },
    { name: "Hot Beef Sausage Roll", price: 800, label: "sausageroll,pastry" },
    { name: "Meat Pie (Per Piece)", price: 1000, label: "meatpie,pastry" }
  ],

  // Supermarket
  "Beverages": [
    { name: "Milo Refill Pack (1kg)", price: 6500, label: "milo,beverage" },
    { name: "Peak Milk Powder (900g)", price: 7800, label: "peakmilk,milk" },
    { name: "Nescafe Classic Coffee (200g)", price: 4500, label: "nescafe,coffee" }
  ],
  "Canned Foods": [
    { name: "Geisha Mackerel in Tomato Sauce", price: 1200, label: "geisha,cannedfood" },
    { name: "Heinz Baked Beans", price: 1500, label: "heinz,beans" },
    { name: "Exeter Corned Beef", price: 3500, label: "cornedbeef,can" }
  ],
  "Snacks": [
    { name: "Pringles Original (Medium)", price: 2500, label: "pringles,snack" },
    { name: "Minimie Chinchin", price: 200, label: "chinchin,snack" },
    { name: "Oreo Sandwich Cookies", price: 1200, label: "oreos,cookies" }
  ],
  "Toiletries": [
    { name: "Dettol Antiseptic Liquid (500ml)", price: 3500, label: "dettol,toiletries" },
    { name: "Colgate Herbal Toothpaste", price: 1800, label: "toothpaste,toiletries" },
    { name: "Ariel Washing Powder (2kg)", price: 5200, label: "detergent,cleaning" }
  ],

  // Electronics & Gadgets
  "Phones & Tablets": [
    { name: "Apple iPhone 15 Pro Max (256GB)", price: 1850000, label: "iphone,smartphone" },
    { name: "Samsung Galaxy S24 Ultra", price: 1950000, label: "samsung,smartphone" },
    { name: "Tecno Camon 20 Pro", price: 285000, label: "tecno,smartphone" },
    { name: "Apple iPad Air (5th Gen)", price: 850000, label: "ipad,tablet" }
  ],
  "Laptops & Computers": [
    { name: "Apple MacBook Pro M3 (14-inch)", price: 2800000, label: "macbook,laptop" },
    { name: "HP Pavilion x360", price: 750000, label: "hp,laptop" },
    { name: "Dell XPS 13 Plus", price: 1450000, label: "dell,laptop" }
  ],
  "Accessories": [
    { name: "Apple AirPods Pro (2nd Gen)", price: 350000, label: "airpods,earbuds" },
    { name: "Oraimo FreePods 4", price: 35000, label: "oraimo,earbuds" },
    { name: "Anker 20W Fast Charger", price: 15000, label: "charger,electronics" }
  ],
  "Televisions": [
    { name: "Samsung 65-Inch 4K UHD Smart TV", price: 850000, label: "smarttv,samsung" },
    { name: "LG 55-Inch OLED TV", price: 1200000, label: "oledtv,lg" },
    { name: "TCL 43-Inch Android TV", price: 280000, label: "tcl,television" }
  ],
  "Game Consoles": [
    { name: "Sony PlayStation 5 (Disc Edition)", price: 950000, label: "playstation5,gaming" },
    { name: "Xbox Series X", price: 850000, label: "xbox,gaming" },
    { name: "Nintendo Switch OLED", price: 450000, label: "nintendoswitch,gaming" }
  ],
  
  // Pharmacy
  "Prescription Drugs": [
    { name: "Amoxil Capsules (500mg)", price: 4500, label: "amoxil,medicine" },
    { name: "Lonart DS Antimalarial", price: 3200, label: "lonart,medicine" },
    { name: "Augmentin Tablets", price: 6500, label: "augmentin,pills" }
  ],
  "Over-the-Counter": [
    { name: "Panadol Extra (1 Card)", price: 500, label: "panadol,medicine" },
    { name: "Emzor Paracetamol", price: 300, label: "paracetamol,medicine" },
    { name: "Andrews Liver Salt", price: 800, label: "liversalt,medicine" }
  ],
  "Vitamins & Supplements": [
    { name: "Wellwoman Original (30 Caps)", price: 15000, label: "vitamins,supplements" },
    { name: "Reload Men's Multi-Vitamin", price: 14500, label: "multivitamin,supplements" },
    { name: "Vitamin C 1000mg", price: 3500, label: "vitaminc,supplements" }
  ],

  // Fashion & Wearables
  "Men's Clothing": [
    { name: "Gucci Classic Polo Shirt", price: 155000, label: "polo,shirt" },
    { name: "Vintage Native Ankara Top", price: 35000, label: "ankara,men" },
    { name: "Levis Classic Denim Jeans", price: 45000, label: "jeans,levis" }
  ],
  "Women's Clothing": [
    { name: "Silk Wrap Dress", price: 45000, label: "wrapdress,women" },
    { name: "Zara Cropped Blazer", price: 65000, label: "blazer,zara" },
    { name: "High-Waist Yoga Pants", price: 18000, label: "yogapants,women" }
  ],
  "Shoes & Bags": [
    { name: "Nike Air Force 1 Sneakers", price: 120000, label: "nike,sneakers" },
    { name: "Leather Birkin Style Bag", price: 85000, label: "leatherbag,fashion" },
    { name: "Men's Italian Leather Loafers", price: 140000, label: "loafers,shoes" }
  ],

  // Beauty & Personal Care
  "Makeup": [
    { name: "MAC Studio Fix Powder Plus Foundation", price: 45000, label: "macpowder,makeup" },
    { name: "Fenty Beauty Lip Gloss", price: 28000, label: "lipgloss,fenty" },
    { name: "Maybelline Fit Me Concealer", price: 12000, label: "concealer,makeup" }
  ],
  "Skincare": [
    { name: "Cerave Hydrating Facial Cleanser", price: 18500, label: "cerave,skincare" },
    { name: "Nivea Even & Radiant Body Lotion", price: 4500, label: "nivea,lotion" },
    { name: "La Roche-Posay Sunscreen SPF 50", price: 25000, label: "sunscreen,skincare" }
  ],
  "Haircare": [
    { name: "MegaGrowth Deep Conditioner", price: 4000, label: "conditioner,hair" },
    { name: "Darling Super Star Hair Extension", price: 2500, label: "hairextensions,beauty" },
    { name: "Cantu Shea Butter Leave-in", price: 8500, label: "cantu,haircare" }
  ]
};

async function seed() {
  const subcategories = await prisma.subcategory.findMany({
    include: { vendors: true, category: true }
  });

  console.log(`Audited ${subcategories.length} subcategories.`);
  let productsCount = 0;

  // Let's destroy all old "Dummy" or irrelevant seed data first to ensure complete cleanup
  const oldSeedData = await prisma.product.deleteMany({
    where: { name: { contains: "Product" } }
  });
  console.log(`Cleared ${oldSeedData.count} old generic products.`);

  for (const sub of subcategories) {
    if (sub.vendors.length === 0) continue;

    const vendor = sub.vendors[Math.floor(Math.random() * sub.vendors.length)];
    const productsToSeed = PRODUCT_DATA[sub.name] || [
      { name: `Premium ${sub.name} Selection`, price: 5000, label: sub.name.toLowerCase().replace(/[^a-z]/g, '') + ',product' },
      { name: `Standard ${sub.name} Pack`, price: 3000, label: sub.name.toLowerCase().replace(/[^a-z]/g, '') + ',item' },
      { name: `Bulk ${sub.name} Offer`, price: 15000, label: sub.name.toLowerCase().replace(/[^a-z]/g, '') + ',bulk' }
    ];

    for (let i = 0; i < productsToSeed.length; i++) {
       const prod = productsToSeed[i];
       // Hard replace existing exact matches to avoid spamming
       const existing = await prisma.product.findFirst({
         where: { name: prod.name, vendorId: vendor.id }
       });
       
       const imageUrl = `https://loremflickr.com/600/600/${prod.label}/all?lock=${Math.floor(Math.random() * 9999999)}`;
       
       if (existing) {
         await prisma.product.update({
           where: { id: existing.id },
           data: { images: imageUrl, price: prod.price }
         });
       } else {
         await prisma.product.create({
           data: {
             name: prod.name,
             description: `Extremely authentic and high quality ${prod.name} supplied locally. Fast delivery immediately available.`,
             price: prod.price,
             inventory: Math.floor(Math.random() * 50) + 10,
             categoryId: sub.categoryId,
             subcategoryId: sub.id,
             vendorId: vendor.id,
             images: imageUrl,
             isAvailable: true,
             discount: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0 // 30% chance of discount
           }
         });
         productsCount++;
       }
    }
  }

  console.log(`✅ Successfully seeded ${productsCount} authentic products directly mapped to contextual subcategories.`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
