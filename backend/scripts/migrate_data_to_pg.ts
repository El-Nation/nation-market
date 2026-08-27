import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const dbPath = path.join(__dirname, '../dev.db');

const parseBool = (val: any) => {
  if (val === null || val === undefined) return false;
  return val === 1 || val === '1' || val === true || val === 'true';
};

const parseDate = (val: any) => {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
};

const parseFloatSafe = (val: any) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const parseIntSafe = (val: any) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

async function main() {
  console.log('Opening SQLite dev.db in read-only mode...');
  const sqlite = new Database(dbPath, { readonly: true });

  console.log('Querying sources...');
  const users = sqlite.prepare('SELECT * FROM "User"').all() as any[];
  const categories = sqlite.prepare('SELECT * FROM "Category"').all() as any[];
  const enquiries = sqlite.prepare('SELECT * FROM "Enquiry"').all() as any[];
  const subcategories = sqlite.prepare('SELECT * FROM "Subcategory"').all() as any[];
  const vendors = sqlite.prepare('SELECT * FROM "VendorProfile"').all() as any[];
  const riders = sqlite.prepare('SELECT * FROM "RiderProfile"').all() as any[];
  const addresses = sqlite.prepare('SELECT * FROM "CustomerAddress"').all() as any[];
  const products = sqlite.prepare('SELECT * FROM "Product"').all() as any[];
  const parentOrders = sqlite.prepare('SELECT * FROM "ParentOrder"').all() as any[];
  const orders = sqlite.prepare('SELECT * FROM "Order"').all() as any[];
  const orderItems = sqlite.prepare('SELECT * FROM "OrderItem"').all() as any[];
  const payments = sqlite.prepare('SELECT * FROM "Payment"').all() as any[];
  const wishlists = sqlite.prepare('SELECT * FROM "WishlistItem"').all() as any[];
  const reviews = sqlite.prepare('SELECT * FROM "Review"').all() as any[];

  console.log('Validating Relationships...');
  let errors = 0;

  // Validate Subcategories
  const catIds = new Set(categories.map(c => c.id));
  for (const sub of subcategories) {
    if (!catIds.has(sub.categoryId)) {
      console.error(`Subcategory ${sub.id} references missing Category ${sub.categoryId}`);
      errors++;
    }
  }

  // Validate Vendors
  const userIds = new Set(users.map(u => u.id));
  for (const ven of vendors) {
    if (!userIds.has(ven.userId)) {
      console.error(`Vendor ${ven.id} references missing User ${ven.userId}`);
      errors++;
    }
  }

  // Validate Products
  const vendorIds = new Set(vendors.map(v => v.id));
  const subIds = new Set(subcategories.map(s => s.id));
  for (const prod of products) {
    if (!vendorIds.has(prod.vendorId)) {
       console.error(`Product ${prod.id} references missing Vendor ${prod.vendorId}`);
       errors++;
    }
    if (!catIds.has(prod.categoryId)) {
       console.error(`Product ${prod.id} references missing Category ${prod.categoryId}`);
       errors++;
    }
    if (prod.subcategoryId && !subIds.has(prod.subcategoryId)) {
       console.error(`Product ${prod.id} references missing Subcategory ${prod.subcategoryId}`);
       errors++;
    }
  }

  // Validate Orders
  const parentOrderIds = new Set(parentOrders.map(p => p.id));
  const riderIds = new Set(riders.map(r => r.id));
  for (const o of orders) {
    if (!parentOrderIds.has(o.parentOrderId)) {
       console.error(`Order ${o.id} references missing ParentOrder ${o.parentOrderId}`);
       errors++;
    }
    if (!vendorIds.has(o.vendorId)) {
       console.error(`Order ${o.id} references missing Vendor ${o.vendorId}`);
       errors++;
    }
    if (o.customerId && !userIds.has(o.customerId)) {
       console.error(`Order ${o.id} references missing User ${o.customerId}`);
       errors++;
    }
    if (o.riderId && !riderIds.has(o.riderId)) {
       console.error(`Order ${o.id} references missing Rider ${o.riderId}`);
       errors++;
    }
  }

  if (errors > 0) {
    console.error(`\nFound ${errors} validation errors. STOPPING MIGRATION.`);
    process.exit(1);
  }

  console.log('All source data relationships validated successfully. Formatting data...');

  const formattedUsers = users.map(u => ({
    ...u,
    marketingOptIn: parseBool(u.marketingOptIn),
    termsAccepted: parseBool(u.termsAccepted),
    isTwoFactorEnabled: parseBool(u.isTwoFactorEnabled),
    birthday: parseDate(u.birthday),
    agreementTimestamp: parseDate(u.agreementTimestamp),
    createdAt: parseDate(u.createdAt) || new Date(),
    updatedAt: parseDate(u.updatedAt) || new Date(),
  }));

  const formattedCategories = categories.map(c => ({
    ...c,
    createdAt: parseDate(c.createdAt) || new Date(),
    updatedAt: parseDate(c.updatedAt) || new Date(),
  }));

  const formattedSubcategories = subcategories.map(s => ({
    ...s,
    createdAt: parseDate(s.createdAt) || new Date(),
    updatedAt: parseDate(s.updatedAt) || new Date(),
  }));

  const formattedVendors = vendors.map(v => ({
    ...v,
    isRegistered: parseBool(v.isRegistered),
    createdAt: parseDate(v.createdAt) || new Date(),
    updatedAt: parseDate(v.updatedAt) || new Date(),
  }));

  const formattedRiders = riders.map(r => ({
    ...r,
    isOnline: parseBool(r.isOnline),
    createdAt: parseDate(r.createdAt) || new Date(),
    updatedAt: parseDate(r.updatedAt) || new Date(),
  }));

  const formattedAddresses = addresses.map(a => ({
    ...a,
    isDefault: parseBool(a.isDefault),
    createdAt: parseDate(a.createdAt) || new Date(),
    updatedAt: parseDate(a.updatedAt) || new Date(),
  }));

  const formattedProducts = products.map(p => ({
    ...p,
    price: parseFloatSafe(p.price),
    discount: parseFloatSafe(p.discount),
    inventory: parseIntSafe(p.inventory),
    isAvailable: parseBool(p.isAvailable),
    createdAt: parseDate(p.createdAt) || new Date(),
    updatedAt: parseDate(p.updatedAt) || new Date(),
  }));

  const formattedParentOrders = parentOrders.map(p => ({
    ...p,
    totalAmount: parseFloatSafe(p.totalAmount),
    createdAt: parseDate(p.createdAt) || new Date(),
    updatedAt: parseDate(p.updatedAt) || new Date(),
  }));

  const formattedOrders = orders.map(o => ({
    ...o,
    subtotal: parseFloatSafe(o.subtotal),
    deliveryFee: parseFloatSafe(o.deliveryFee),
    platformFee: parseFloatSafe(o.platformFee),
    vendorEarnings: parseFloatSafe(o.vendorEarnings),
    riderEarnings: parseFloatSafe(o.riderEarnings),
    total: parseFloatSafe(o.total),
    createdAt: parseDate(o.createdAt) || new Date(),
    updatedAt: parseDate(o.updatedAt) || new Date(),
  }));

  const formattedOrderItems = orderItems.map(o => ({
    ...o,
    quantity: parseIntSafe(o.quantity),
    price: parseFloatSafe(o.price),
    createdAt: parseDate(o.createdAt) || new Date(),
    updatedAt: parseDate(o.updatedAt) || new Date(),
  }));

  const formattedPayments = payments.map(p => ({
    ...p,
    amount: parseFloatSafe(p.amount),
    createdAt: parseDate(p.createdAt) || new Date(),
    updatedAt: parseDate(p.updatedAt) || new Date(),
  }));

  const formattedWishlists = wishlists.map(w => ({
    ...w,
    createdAt: parseDate(w.createdAt) || new Date(),
  }));

  const formattedReviews = reviews.map(r => ({
    ...r,
    rating: parseIntSafe(r.rating),
    createdAt: parseDate(r.createdAt) || new Date(),
    updatedAt: parseDate(r.updatedAt) || new Date(),
  }));

  console.log('Connecting to Supabase PostgreSQL and enforcing transaction...');

  try {
    await prisma.$transaction(async (tx) => {
      if (formattedUsers.length) { console.log(`Inserting ${formattedUsers.length} Users...`); await tx.user.createMany({ data: formattedUsers }); }
      if (formattedCategories.length) { console.log(`Inserting ${formattedCategories.length} Categories...`); await tx.category.createMany({ data: formattedCategories }); }
      if (enquiries.length) { console.log(`Inserting ${enquiries.length} Enquiries...`); await tx.enquiry.createMany({ data: enquiries }); }
      if (formattedSubcategories.length) { console.log(`Inserting ${formattedSubcategories.length} Subcategories...`); await tx.subcategory.createMany({ data: formattedSubcategories }); }
      if (formattedVendors.length) { console.log(`Inserting ${formattedVendors.length} Vendors...`); await tx.vendorProfile.createMany({ data: formattedVendors }); }
      if (formattedRiders.length) { console.log(`Inserting ${formattedRiders.length} Riders...`); await tx.riderProfile.createMany({ data: formattedRiders }); }
      if (formattedAddresses.length) { console.log(`Inserting ${formattedAddresses.length} Addresses...`); await tx.customerAddress.createMany({ data: formattedAddresses }); }
      if (formattedProducts.length) { console.log(`Inserting ${formattedProducts.length} Products...`); await tx.product.createMany({ data: formattedProducts }); }
      if (formattedParentOrders.length) { console.log(`Inserting ${formattedParentOrders.length} ParentOrders...`); await tx.parentOrder.createMany({ data: formattedParentOrders }); }
      if (formattedOrders.length) { console.log(`Inserting ${formattedOrders.length} Orders...`); await tx.order.createMany({ data: formattedOrders }); }
      if (formattedOrderItems.length) { console.log(`Inserting ${formattedOrderItems.length} OrderItems...`); await tx.orderItem.createMany({ data: formattedOrderItems }); }
      if (formattedPayments.length) { console.log(`Inserting ${formattedPayments.length} Payments...`); await tx.payment.createMany({ data: formattedPayments }); }
      if (formattedWishlists.length) { console.log(`Inserting ${formattedWishlists.length} Wishlists...`); await tx.wishlistItem.createMany({ data: formattedWishlists }); }
      if (formattedReviews.length) { console.log(`Inserting ${formattedReviews.length} Reviews...`); await tx.review.createMany({ data: formattedReviews }); }
    }, {
      maxWait: 50000, 
      timeout: 100000 
    });

    console.log('✅ Entire database successfully migrated!');
  } catch (err) {
    console.error('❌ MIGRATION FAILED - TRANSACTION ROLLED BACK.');
    console.error(err);
    process.exit(1);
  }
}

main();
