import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';


// ─── Addresses ───────────────────────────────────────────────────────────────

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const addresses = await prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ success: true, data: addresses });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { label, line1, line2, city, state, country, isDefault } = req.body;

    // If this is set as default, unset all others first
    if (isDefault) {
      await prisma.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.customerAddress.create({
      data: { userId, label: label || 'Home', line1, line2, city, state, country: country || 'Nigeria', isDefault: isDefault || false }
    });
    res.status(201).json({ success: true, data: address });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { label, line1, line2, city, state, country, isDefault } = req.body;

    // Ownership check
    const existing = await prisma.customerAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data: { label, line1, line2, city, state, country, isDefault }
    });
    res.json({ success: true, data: address });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const existing = await prisma.customerAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prisma.customerAddress.delete({ where: { id } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
