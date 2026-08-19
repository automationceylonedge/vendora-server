import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import orderRoutes from './modules/orders/order.routes';
import productRoutes from './modules/products/product.routes';
import userRoutes from './modules/users/user.routes';

const app = express();

/* ── Cloudflare R2 ── */
import { initializeR2 } from './shared/utils/r2';
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

/* ── Error handler (must be last) ── */
app.use(errorHandler);

/* ── Start server ── */
app.listen(env.port, () => {
  console.log(`✅ Vendora server listening on port ${env.port}`);
});

export default app;
