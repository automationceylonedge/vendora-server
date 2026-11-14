import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../shared/middleware/upload.js';
import { updateDeliverySchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch(
  '/me/delivery',
  validate(updateDeliverySchema),
  userController.updateDelivery,
);
router.patch('/me/business', upload.single('logo'), userController.updateBusiness);

export default router;
