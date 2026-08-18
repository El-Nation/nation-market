import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/customer.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, createAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

export default router;
