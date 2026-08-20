import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../utils/cloudinary';

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────
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

export const updateStore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { storeName, description, address, openingHours, clearLogo, clearCover } = req.body;

    const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let logoUrl    = clearLogo  === 'true' ? null : existing.logoUrl    ?? null;
    let logoPublicId  = clearLogo  === 'true' ? null : existing.logoPublicId  ?? null;
    let coverUrl   = clearCover === 'true' ? null : existing.coverUrl   ?? null;
    let coverPublicId = clearCover === 'true' ? null : existing.coverPublicId ?? null;

    // Delete old Cloudinary asset before overwriting
    if (clearLogo === 'true' && existing.logoPublicId) {
      await deleteImageFromCloudinary(existing.logoPublicId);
    }
    if (clearCover === 'true' && existing.coverPublicId) {
      await deleteImageFromCloudinary(existing.coverPublicId);
    }

    if (files?.['logoUpload']) {
      // Delete the old logo asset from Cloudinary if one exists
      if (existing.logoPublicId) await deleteImageFromCloudinary(existing.logoPublicId);
      // Upload new — w_400, square crop, f_auto + q_auto applied automatically
      const result = await uploadImageToCloudinary(files['logoUpload'][0].buffer, 'nation-market/logos', 400, 400, 'fill');
      logoUrl      = result.secure_url;
      logoPublicId = result.public_id;
    }

    if (files?.['coverUpload']) {
      if (existing.coverPublicId) await deleteImageFromCloudinary(existing.coverPublicId);
      // Cover banner: wide crop 1200×400
      const result = await uploadImageToCloudinary(files['coverUpload'][0].buffer, 'nation-market/covers', 1200, 400, 'fill');
      coverUrl      = result.secure_url;
      coverPublicId = result.public_id;
    }

    const updated = await prisma.vendorProfile.update({
      where: { userId },
      data: { storeName, description, address, openingHours, logoUrl, logoPublicId, coverUrl, coverPublicId }
    });

    res.json({ success: true, message: 'Store updated.', data: updated });
  } catch (err: any) {
    console.error('Store Update Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// SUBCATEGORIES
// ─────────────────────────────────────────────
export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const profileId = (req as any).user.vendorProfile.id;
    const profile = await prisma.vendorProfile.findUnique({
      where: { id: profileId },
      include: { subcategories: true }
    });
    res.json({ success: true, data: profile?.subcategories || [] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getAvailableSubcategories = async (req: Request, res: Response) => {
  try {
    const businessType = (req as any).user.vendorProfile.businessType;
    const category = await prisma.category.findFirst({
      where: { name: businessType },
      include: { subcategories: true }
    });
    res.json({ success: true, data: category?.subcategories || [] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const linkSubcategories = async (req: Request, res: Response) => {
  try {
    const profileId  = (req as any).user.vendorProfile.id;
    const businessType = (req as any).user.vendorProfile.businessType;
    const { subcategoryIds } = req.body as { subcategoryIds: string[] };

    // ── SECURITY: every requested subcategoryId must belong to the vendor's primary category ──
    const primaryCategory = await prisma.category.findFirst({ where: { name: businessType } });
    if (!primaryCategory) return res.status(400).json({ success: false, message: 'Primary category not found.' });

    const allowed = await prisma.subcategory.findMany({
      where: { categoryId: primaryCategory.id, id: { in: subcategoryIds } }
    });
    if (allowed.length !== subcategoryIds.length) {
      return res.status(403).json({
        success: false,
        message: 'One or more subcategories do not belong to your primary business category.'
      });
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: profileId },
      data: { subcategories: { set: subcategoryIds.map(id => ({ id })) } },
      include: { subcategories: true }
    });
    res.json({ success: true, data: updated.subcategories });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────
// HELPERS — private category guard
// ─────────────────────────────────────────────
/**
 * Returns the vendor's primary Category and validates that the given subcategoryId
 * (if any) belongs to that category. Throws an error string on violation.
 */
const resolveAndGuardCategory = async (businessType: string, subcategoryId?: string) => {
  const primaryCategory = await prisma.category.findFirst({ where: { name: businessType } });
  if (!primaryCategory) throw new Error('Invalid primary category mapping for this vendor.');

  if (subcategoryId) {
    const sub = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
    if (!sub || sub.categoryId !== primaryCategory.id) {
      throw new Error(
        `Subcategory does not belong to your primary category (${businessType}). Request rejected.`
      );
    }
  }

  return primaryCategory;
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
export const getProducts = async (req: Request, res: Response) => {
  try {
    const profileId = (req as any).user.vendorProfile.id;
    const items = await prisma.product.findMany({
      where: { vendorId: profileId },
      include: { category: true, subcategory: true }
    });
    res.json({ success: true, data: items });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const profileId   = (req as any).user.vendorProfile.id;
    const businessType = (req as any).user.vendorProfile.businessType;
    const { subcategoryId, name, description, price, discount, inventory, isAvailable, unit } = req.body;

    // ── SECURITY: validate subcategory belongs to vendor's primary category ──
    let primaryCategory;
    try {
      primaryCategory = await resolveAndGuardCategory(businessType, subcategoryId || undefined);
    } catch (secErr: any) {
      return res.status(403).json({ success: false, message: secErr.message });
    }

    let images        = '';
    let imagePublicId = '';

    if (req.file) {
      // Products: 800px wide, ratio maintained, f_auto + q_auto applied
      const result = await uploadImageToCloudinary(req.file.buffer, 'nation-market/products', 800);
      images        = result.secure_url;
      imagePublicId = result.public_id;
    }

    const created = await prisma.product.create({
      data: {
        vendorId:     profileId,
        categoryId:   primaryCategory.id,
        subcategoryId: subcategoryId || null,
        name,
        description,
        price:        parseFloat(price),
        discount:     parseFloat(discount || '0'),
        inventory:    parseInt(inventory  || '0'),
        isAvailable:  isAvailable === 'true' || isAvailable === true,
        unit,
        images,
        imagePublicId: imagePublicId || null
      }
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const profileId    = (req as any).user.vendorProfile.id;
    const businessType = (req as any).user.vendorProfile.businessType;
    const { id }       = req.params;

    const existing = await prisma.product.findFirst({ where: { id, vendorId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });

    const { subcategoryId, name, description, price, discount, inventory, isAvailable, unit } = req.body;

    // ── SECURITY: validate any new subcategory assignment ──
    if (subcategoryId !== undefined && subcategoryId) {
      try {
        await resolveAndGuardCategory(businessType, subcategoryId);
      } catch (secErr: any) {
        return res.status(403).json({ success: false, message: secErr.message });
      }
    }

    const updateData: any = {};
    if (name        !== undefined) updateData.name        = name;
    if (description !== undefined) updateData.description = description;
    if (price       !== undefined) updateData.price       = parseFloat(price);
    if (discount    !== undefined) updateData.discount    = parseFloat(discount);
    if (inventory   !== undefined) updateData.inventory   = parseInt(inventory);
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (unit        !== undefined) updateData.unit        = unit;
    if (subcategoryId !== undefined) updateData.subcategoryId = subcategoryId || null;

    if (req.file) {
      // Delete the previous image from Cloudinary before uploading the replacement
      if (existing.imagePublicId) await deleteImageFromCloudinary(existing.imagePublicId);
      const result          = await uploadImageToCloudinary(req.file.buffer, 'nation-market/products', 800);
      updateData.images     = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }

    const updated = await prisma.product.update({ where: { id }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const profileId = (req as any).user.vendorProfile.id;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({ where: { id, vendorId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });

    // Delete asset from Cloudinary before removing from DB
    if (existing.imagePublicId) await deleteImageFromCloudinary(existing.imagePublicId);

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product removed.' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
export const getVendorOrders = async (req: any, res: any) => {
  try {
    const profileId = req.user.vendorProfile.id;
    const orders = await prisma.order.findMany({
      where: { vendorId: profileId },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true, images: true } } } },
        payment: { select: { status: true, amount: true, reference: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateOrderStatus = async (req: any, res: any) => {
  try {
    const profileId = req.user.vendorProfile.id;
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const existing = await prisma.order.findFirst({ where: { id, vendorId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
