import { Router } from 'express';
import * as sliderController from './slider.controller.js';

const router = Router();

// Public read for the mobile app — returns active slides in display order.
router.get('/', sliderController.listActive);

export default router;
