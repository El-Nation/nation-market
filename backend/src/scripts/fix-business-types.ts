import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const migrations = [
  { match: /Supermarket/i, target: 'Supermarket & Groceries' },
  { match: /Fashion/i, target: 'Fashion & Beauty' },
  { match: /Electronics/i, target: 'Electronics & Gadgets' },
  { match: /Restaurant/i, target: 'Restaurants & Food' },
  { match: /Agriculture/i, target: 'Agriculture & Farming' },
  { match: /Pharmacy/i, target: 'Pharmacy & Health' },
  { match: /Books/i, target: 'Books & Education' }
];

async function main() {
  const profiles = await prisma.vendorProfile.findMany();
  let updated = 0;

  for (const profile of profiles) {
    let newType = null;
    
    // Check if the current type matches our migration map
    for (const migration of migrations) {
      if (migration.match.test(profile.businessType)) {
        if (profile.businessType !== migration.target) {
          newType = migration.target;
        }
        break;
      }
    }

    if (newType) {
      console.log(`Migrating: ${profile.businessType} -> ${newType}`);
      await prisma.vendorProfile.update({
        where: { id: profile.id },
        data: { businessType: newType }
      });
      updated++;
    }
  }

  console.log(`Completed. Updated ${updated} vendor profiles successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
