import express from 'express';
import { 
  getVendorProfile, 
  updateStore, 
  getSubcategories, getAvailableSubcategories, linkSubcategories,
  getProducts, createProduct, updateProduct, deleteProduct,
  getVendorOrders, updateOrderStatus
} from '../controllers/vendor.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

import { prisma } from '../prisma';

const attachVendorProfile = async (req: any, res: any, next: any) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Vendor Profile not found' });
    req.user.vendorProfile = profile;
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Base protection ensures all Vendor routes strictly verify token and role
const protectVendor = [protect as any, authorize('VENDOR') as any, attachVendorProfile as any];

// Store Management
router.get('/profile', protectVendor, getVendorProfile);
router.put('/store', protectVendor, upload.fields([{ name: 'logoUpload', maxCount: 1 }, { name: 'coverUpload', maxCount: 1 }]), updateStore);

// Subcategories
router.get('/subcategories', protectVendor, getSubcategories);
router.get('/subcategories/available', protectVendor, getAvailableSubcategories);
router.post('/subcategories/link', protectVendor, linkSubcategories);

// Products
router.post('/products', protectVendor, upload.single('image'), createProduct);
router.get('/products', protectVendor, getProducts);
router.put('/products/:id', protectVendor, upload.single('image'), updateProduct);
router.delete('/products/:id', protectVendor, deleteProduct);

// Orders
router.get('/orders', protectVendor, getVendorOrders);
router.put('/orders/:id/status', protectVendor, updateOrderStatus);

export default router;
