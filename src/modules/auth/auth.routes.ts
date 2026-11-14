import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { signupSchema, signinSchema, refreshTokenSchema, googleSigninSchema } from './auth.validation.js';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/google', validate(googleSigninSchema), authController.googleSignIn);

export default router;
