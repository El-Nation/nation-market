import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import path from 'path';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dbPath = path.join(__dirname, '../dev.db');
const sqlite = new Database(dbPath, { readonly: true });

async function verify() {
  const models = ['User', 'Category', 'Enquiry', 'Subcategory', 'VendorProfile', 'RiderProfile', 'CustomerAddress', 'Product', 'ParentOrder', 'Order', 'OrderItem', 'Payment', 'WishlistItem', 'Review'];
  console.log('| Model | Source (SQLite) | Dest (Postgres) | Difference |');
  console.log('|---|---|---|---|');
  let issues = 0;
  for (const m of models) {
    const src = (sqlite.prepare(`SELECT COUNT(*) as c FROM "${m}"`).get() as any).c;
    const destName = m.charAt(0).toLowerCase() + m.slice(1);
    const dest = await (prisma as any)[destName].count();
    const diff = dest - src;
    console.log(`| ${m} | ${src} | ${dest} | ${diff} |`);
    if (diff !== 0) issues++;
  }
  if (issues > 0) {
    console.log('\n❌ MIGRATION INCONSISTENCIES FOUND.');
  } else {
    console.log('\n✅ ALL COUNTS EXACTLY MATCH.');
  }
}
verify();
