import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from './order.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('buyer', 'admin'), validate(createOrderSchema), orderController.create);
router.get('/', authorize('buyer', 'vendor', 'admin'), orderController.list);
router.patch(
  '/:id/status',
  authorize('vendor', 'admin'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus,
);
router.get('/:id', authorize('buyer', 'vendor', 'admin'), orderController.getById);

export default router;
