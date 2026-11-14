import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import productRoutes from './modules/products/product.routes.js';
import userRoutes from './modules/users/user.routes.js';
import payhereRoutes from './modules/payhere/payhere.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import sliderRoutes from './modules/sliders/slider.routes.js';
import sliderAdminRoutes from './modules/sliders/slider.admin.routes.js';

const app = express();

/* ── Cloudflare R2 ── */
import { initializeR2 } from './shared/utils/r2.js';
initializeR2();

/* ── MongoDB ── */
mongoose
  .connect(env.mongodbUri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

/* ── Middleware ── */
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Health check ── */
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Vendora API is running' });
});

/* ── Routes ── */
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payhere', payhereRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/admin/sliders', sliderAdminRoutes);

/* ── Error handler (must be last) ── */
app.use(errorHandler);

/* ── Start server ── */
app.listen(env.port, () => {
  console.log(`✅ Vendora server listening on port ${env.port}`);
});

export default app;
