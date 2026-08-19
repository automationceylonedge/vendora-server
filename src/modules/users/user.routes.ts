import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateDeliverySchema } from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch(
  '/me/delivery',
  validate(updateDeliverySchema),
  userController.updateDelivery,
);

export default router;
