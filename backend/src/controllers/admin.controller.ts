import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';


export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalVendors = await prisma.user.count({ where: { role: 'VENDOR' } });
    const totalRiders = await prisma.user.count({ where: { role: 'RIDER' } });
    
    // Once Order model is populated, we would fetch dynamic order logic 
    const totalOrders = await prisma.order.count();
    const activeOrders = await prisma.order.count({ where: { status: 'PROCESSING' } }); // Mock active status
    const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });
    
    const recentActivity = await prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalVendors,
        totalRiders,
        totalOrders,
        activeOrders,
        completedOrders,
        totalRevenue: 0,
        platformCharges: 0,
        recentActivity
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      include: { vendorProfile: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRiders = async (req: Request, res: Response) => {
  try {
    const riders = await prisma.user.findMany({
      where: { role: 'RIDER' },
      include: { riderProfile: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: riders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    // Admin pulls EVERYTHING across all vendors.
    const products = await prisma.product.findMany({
      include: { 
        vendor: { include: { user: true } }, 
        category: true, 
        vendorSubcategory: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subcategories: true }
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { name, categoryId } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const created = await prisma.subcategory.create({
      data: { name, slug, categoryId }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const updated = await prisma.subcategory.update({
      where: { id },
      data: { name, slug, categoryId }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subcategory.delete({ where: { id } });
    res.json({ success: true, message: 'Deleted cleanly' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
