import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema } from './product.validation.js';
import { upload } from '../../shared/middleware/upload.js';

const router = Router();

// Public buyer-facing route (no auth required)
router.get('/browse', productController.browse);

// All remaining product routes require authentication + vendor/admin role
router.use(authenticate, authorize('vendor', 'admin'));

router.post(
  '/',
  upload.array('images', 5),
  validate(createProductSchema),
  productController.create,
);

router.get('/', productController.list);
router.get('/:id', productController.getById);

router.patch(
  '/:id',
  upload.array('images', 5),
  validate(updateProductSchema),
  productController.update,
);

router.delete('/:id', productController.remove);

export default router;
