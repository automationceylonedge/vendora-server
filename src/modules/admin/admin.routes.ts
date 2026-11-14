import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/vendors', adminController.listVendors);
router.get('/products', adminController.listProducts);

export default router;
