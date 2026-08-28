import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import authRoutes from './routes/auth.routes';
import vendorRoutes from './routes/vendor.routes';
import customerRoutes from './routes/customer.routes';
import adminRoutes from './routes/admin.routes';
import storefrontRoutes from './routes/storefront.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import riderRoutes from './routes/rider.routes';

// Prevent server from crashing on unhandled errors (Keep 24/7 online)
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection:', reason, promise);
});

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string
});

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_CUSTOMER_URL,
  process.env.FRONTEND_VENDOR_URL,
  process.env.FRONTEND_ADMIN_URL,
  process.env.FRONTEND_RIDER_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow no origin
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true
}));
app.use((req, res, next) => { console.log('[ROUTE HIT]', req.method, req.url); next(); });
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/customer/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/storefront', storefrontRoutes); // Public — no auth required

app.get('/', (req, res) => {
    res.send('Nation-Market Backend API Running Successfully with Cloudinary.');
});

app.listen(PORT, () => {
    console.log(`Backend server successfully listening on port ${PORT}`);
});

// Force hot-reload to load updated Prisma schema

