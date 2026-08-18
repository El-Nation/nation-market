import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

export const getVendorProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
