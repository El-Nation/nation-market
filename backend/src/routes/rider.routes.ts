import { Router } from 'express';
import {
  toggleRiderStatus,
  getAvailableDeliveries,
  claimDelivery,
  getActiveDelivery,
  updateDeliveryStatus
} from '../controllers/rider.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All rider routes require authentication + RIDER role
router.use(protect, authorize('RIDER'));

router.put('/status', toggleRiderStatus);
router.get('/deliveries/available', getAvailableDeliveries);
router.get('/deliveries/active', getActiveDelivery);
router.put('/deliveries/:id/claim', claimDelivery);
router.put('/deliveries/:id/status', updateDeliveryStatus);

export default router;
