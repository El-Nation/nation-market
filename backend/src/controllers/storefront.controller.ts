import { Request, Response } from 'express';
import { prisma } from '../prisma';

// ─── GET /api/storefront/categories ──────────────────────────────────────────
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── GET /api/storefront/vendors ─────────────────────────────────────────────
export const getVendors = async (req: Request, res: Response) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { status: 'ACTIVE', isRegistered: true };
    if (category) where.businessType = category;
    if (search) where.storeName = { contains: search };

    const [vendors, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        select: {
          id: true,
          storeName: true,
          description: true,
          logoUrl: true,
          coverUrl: true,
          address: true,
          businessType: true,
          openingHours: true,
          subcategories: { select: { id: true, name: true, slug: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorProfile.count({ where })
    ]);

    res.json({ success: true, data: vendors, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── GET /api/storefront/vendors/:id ─────────────────────────────────────────
export const getVendorStorefront = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '24' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        id: true,
        storeName: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        address: true,
        businessType: true,
        openingHours: true,
        subcategories: { select: { id: true, name: true, slug: true } }
      }
    });

    if (!vendor) return res.status(404).json({ success: false, message: 'Store not found' });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { vendorId: id, isAvailable: true },
        select: {
          id: true, name: true, description: true, price: true, discount: true,
          images: true, unit: true, inventory: true, isAvailable: true,
          subcategory: { select: { name: true } },
          category: { select: { name: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { vendorId: id, isAvailable: true } })
    ]);

    res.json({
      success: true,
      data: { vendor, products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── GET /api/storefront/products ────────────────────────────────────────────
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, vendorId, page = '1', limit = '24' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { isAvailable: true };

    if (vendorId) where.vendorId = vendorId;

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (subcategory) {
      const sub = await prisma.subcategory.findFirst({ where: { slug: subcategory } });
      if (sub) where.subcategoryId = sub.id;
    }
    if (search) where.name = { contains: search };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true, name: true, description: true, price: true, discount: true,
          images: true, unit: true, inventory: true, isAvailable: true,
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
          vendor: {
            select: { id: true, storeName: true, logoUrl: true, address: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({ success: true, data: products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── GET /api/storefront/products/:id ────────────────────────────────────────
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true, price: true, discount: true,
        images: true, unit: true, inventory: true, isAvailable: true, sku: true, variations: true,
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        vendor: {
          select: { id: true, storeName: true, logoUrl: true, coverUrl: true, address: true, openingHours: true, businessType: true }
        }
      }
    });

    if (!product || !product.isAvailable) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── GET /api/storefront/search ───────────────────────────────────────────────
export const searchStorefront = async (req: Request, res: Response) => {
  try {
    const { q } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { products: [], vendors: [], categories: [] } });
    }

    const query = q.trim();

    const [products, vendors, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        select: {
          id: true, name: true, price: true, discount: true, images: true,
          vendor: { select: { id: true, storeName: true } }
        },
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorProfile.findMany({
        where: {
          isRegistered: true,
          status: 'ACTIVE',
          storeName: { contains: query }
        },
        select: { id: true, storeName: true, logoUrl: true, businessType: true, address: true },
        take: 5
      }),
      prisma.category.findMany({
        where: { name: { contains: query } },
        select: { id: true, name: true, slug: true },
        take: 5
      })
    ]);

    res.json({ success: true, data: { products, vendors, categories } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
