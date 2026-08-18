import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import vendorRoutes from './routes/vendor.routes';
import customerRoutes from './routes/customer.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Nation-Market Backend API Running Successfully.');
});

app.listen(PORT, () => {
    console.log(`Backend server successfully listening on port ${PORT}`);
});
