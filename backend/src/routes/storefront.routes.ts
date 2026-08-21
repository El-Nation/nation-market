import express from 'express';
import {
  getCategories,
  getVendors,
  getVendorStorefront,
  getProducts,
  getProductById,
  searchStorefront
} from '../controllers/storefront.controller';

const router = express.Router();

// All routes are fully public — no authentication required
router.get('/categories', getCategories);
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorStorefront);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/search', searchStorefront);

export default router;
