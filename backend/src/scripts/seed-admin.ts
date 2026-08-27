import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log('Seeding initial admin account...');

  const email = 'lewisdunk170@gmail.com';
  const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
  
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`Admin account ${email} already exists.`);
      return;
    }

    // Hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        country: 'Nigeria',
        phone: '07066784058',
        termsAccepted: true,
        agreementVersion: 'ADM-1.0.0',
        agreementTimestamp: new Date(),
        // requirePasswordChange could be added dynamically if schema allowed it, but here we just seed it.
      }
    });

    console.log(`✅ Admin account created successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log(`Please login via the unified portal in the customer app and change the password immediately.`);

  } catch (error) {
    console.error('Failed to seed admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
