import { Router } from 'express';
import * as productController from './product.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './product.validation';
import { upload } from '../../shared/middleware/upload';

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
