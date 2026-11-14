import { Router } from 'express';
import * as sliderController from './slider.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { upload } from '../../shared/middleware/upload.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', sliderController.listAll);
router.post('/', upload.single('image'), sliderController.addSlider);
router.patch('/reorder', sliderController.reorder);
router.delete('/:id', sliderController.remove);

export default router;
