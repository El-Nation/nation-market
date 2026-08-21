import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalVendors = await prisma.user.count({ where: { role: 'VENDOR' } });
    const totalRiders = await prisma.user.count({ where: { role: 'RIDER' } });

    const totalOrders = await prisma.order.count();
    const activeOrders = await prisma.order.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] } } });
    const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });

    // Aggregate live revenue and platform charges from successful payments
    const revenueAgg = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });

    const platformFeeAgg = await prisma.order.aggregate({
      where: { payment: { status: 'SUCCESS' } },
      _sum: { platformFee: true }
    });

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
        totalRevenue: revenueAgg._sum.amount || 0,
        platformCharges: platformFeeAgg._sum.platformFee || 0,
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
    const products = await prisma.product.findMany({
      include: {
        vendor: true,
        category: true,
        subcategory: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        vendor: { select: { id: true, storeName: true, logoUrl: true } },
        rider: { select: { id: true, vehicleType: true, user: { select: { firstName: true, lastName: true, phone: true } } } },
        items: { include: { product: { select: { name: true, price: true } } } },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          select: {
            id: true,
            subtotal: true,
            deliveryFee: true,
            platformFee: true,
            total: true,
            status: true,
            type: true,
            customer: { select: { firstName: true, lastName: true, email: true } },
            vendor: { select: { storeName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: payments });
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
