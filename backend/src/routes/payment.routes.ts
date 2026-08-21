import { Router } from 'express';
import { handlePaystackWebhook, verifyPayment } from '../controllers/payment.controller';

const router = Router();

// Paystack webhook endpoint (public, signature-verified)
router.post('/paystack-webhook', handlePaystackWebhook);

// Payment verification endpoint
router.get('/verify/:reference', verifyPayment);

export default router;
