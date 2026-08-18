import { Router } from 'express';
import {
  getOverviewStats,
  getVendors,
  getCustomers,
  getRiders
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Strict server-side role protection - only ADMIN can hit these
router.use(protect, authorize('ADMIN'));

router.get('/stats', getOverviewStats);
router.get('/vendors', getVendors);
router.get('/customers', getCustomers);
router.get('/riders', getRiders);

export default router;
