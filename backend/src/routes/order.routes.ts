import { Router } from 'express';
import { createOrder, getCustomerOrders, getOrderById } from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, createOrder);
router.get('/', protect, getCustomerOrders);
router.get('/:id', protect, getOrderById);

export default router;
