import { Router } from 'express';
import * as orderController from './order.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createOrderSchema } from './order.validation';

const router = Router();

router.use(authenticate, authorize('buyer', 'admin'));

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);

export default router;
