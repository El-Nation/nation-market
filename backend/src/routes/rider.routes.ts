import { Router } from 'express';
import {
  toggleRiderStatus,
  getAvailableDeliveries,
  claimDelivery,
  getActiveDelivery,
  updateDeliveryStatus,
  getDeliveryHistory
} from '../controllers/rider.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All rider routes require authentication + RIDER role
router.use(protect, authorize('RIDER'));

router.put('/status', toggleRiderStatus);
router.get('/deliveries/available', getAvailableDeliveries);
router.get('/deliveries/active', getActiveDelivery);
router.get('/deliveries/history', getDeliveryHistory);
router.put('/deliveries/:id/claim', claimDelivery);
router.put('/deliveries/:id/status', updateDeliveryStatus);

export default router;
