import { Router } from 'express';
import { register, login, applyVendor, applyRider, forgotPassword, resetPassword, updateDetails, updateContact, updatePassword, generate2FA, enable2FA, disable2FA, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/vendor/apply', applyVendor);
router.post('/rider/apply', applyRider);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);

// Security & Profile Routes
router.put('/update-details', protect, updateDetails);
router.put('/update-contact', protect, updateContact);
router.put('/update-password', protect, updatePassword);
router.post('/2fa/generate', protect, generate2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);

export default router;
