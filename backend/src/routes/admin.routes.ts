import { Router } from 'express';
import {
  getOverviewStats,
  getVendors,
  getCustomers,
  getRiders,
  getProducts,
  getCategories,
  getOrders,
  getPayments,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Strict server-side role protection - only ADMIN can hit these
router.use(protect, authorize('ADMIN'));

router.get('/stats', getOverviewStats);
router.get('/vendors', getVendors);
router.get('/customers', getCustomers);
router.get('/riders', getRiders);
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.get('/orders', getOrders);
router.get('/payments', getPayments);

router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

export default router;
