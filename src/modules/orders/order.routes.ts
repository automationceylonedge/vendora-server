import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema } from './order.validation.js';

const router = Router();

router.use(authenticate, authorize('buyer', 'admin'));

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);

export default router;
