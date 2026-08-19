import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { signupSchema, signinSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

export default router;
