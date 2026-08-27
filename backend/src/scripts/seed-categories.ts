import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const categoriesWithSubcategories = [
  {
    name: "Supermarket & Groceries",
    subs: ["Meat & Poultry", "Fish & Seafood", "Fresh Produce", "Dairy & Eggs", "Pantry Staples", "Canned & Packaged Goods", "Snacks & Confectionery", "Beverages", "Cleaning & Household Supplies", "Toiletries & Personal Care"]
  },
  {
    name: "Fashion & Beauty",
    subs: ["Men's Clothing", "Women's Clothing", "Kids & Baby Clothing", "Footwear", "Bags & Luggage", "Watches & Jewelry", "Accessories", "Skincare & Cosmetics", "Haircare & Fragrances"]
  },
  {
    name: "Electronics & Gadgets",
    subs: ["Smartphones & Tablets", "Computers & Laptops", "Audio & Speakers", "Televisions & Video", "Cameras & Photography", "Gaming Consoles & Accessories", "Wearable Technology", "Computer Accessories & Peripherals", "Smart Home Devices"]
  },
  {
    name: "Restaurants & Food",
    subs: ["Local & Traditional Dishes", "Intercontinental Cuisine", "Fast Food & Burgers", "Pizza & Pasta", "Grills, Suya & BBQ", "Pastries, Cakes & Desserts", "Drinks, Smoothies & Parfaits", "Healthy & Vegan Options"]
  },
  {
    name: "Agriculture & Farming",
    subs: ["Livestock & Animals", "Poultry & Eggs", "Fish & Aquaculture", "Farm Produce", "Seeds, Seedlings & Plants", "Animal Feed & Veterinary Supplies", "Farming Tools & Machinery", "Agrochemicals"]
  },
  {
    name: "Pharmacy & Health",
    subs: ["Over-The-Counter (OTC) Drugs", "Prescription Medication", "Vitamins & Dietary Supplements", "First Aid & Medical Supplies", "Mother & Baby Care", "Sexual Wellness", "Medical Devices & Equipment", "Personal Healthcare"]
  },
  {
    name: "Books & Education",
    subs: ["Educational Textbooks", "Fiction & Literature", "Non-Fiction & Biographies", "Children's Books", "Religious & Spiritual Books", "Business & Self-Help", "Stationery & Office Supplies", "Study Guides & Test Prep"]
  },
  {
    name: "Home, Kitchen & Furniture",
    subs: ["Furniture", "Home Decor & Bedding", "Kitchenware & Dining", "Large Home Appliances", "Small Appliances"]
  },
  {
    name: "Automotive & Industrial",
    subs: ["Car Parts & Accessories", "Oils, Fluids & Car Care", "Motorcycles & Bicycles", "Generators & Power Solutions", "Tools & Hardware"]
  },
  {
    name: "Toys, Kids & Babies",
    subs: ["Toys & Games", "Baby Gear & Strollers", "Diapering & Potty", "Maternity Care"]
  }
];

function generateSlug(tag: string) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  console.log("Seeding Database Taxonomy (Categories & Subcategories)...");
  
  for (const catData of categoriesWithSubcategories) {
    // Upsert the Primary Category
    const category = await prisma.category.upsert({
      where: { slug: generateSlug(catData.name) },
      update: { name: catData.name }, // ensure name format matches
      create: { name: catData.name, slug: generateSlug(catData.name) }
    });

    console.log(`Verified Primary Category: ${category.name}`);

    // Upsert the Subcategories underneath it
    for (const subName of catData.subs) {
      const slug = generateSlug(`${category.name}-${subName}`);
      
      await prisma.subcategory.upsert({
        where: { slug },
        update: { name: subName, categoryId: category.id },
        create: { name: subName, slug, categoryId: category.id }
      });
    }
  }

  console.log("Taxonomy Seeding Completely Finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
