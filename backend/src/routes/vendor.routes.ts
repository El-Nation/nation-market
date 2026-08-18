import express from 'express';
import { getVendorProfile } from '../controllers/vendor.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/profile', protect as any, getVendorProfile);

export default router;
