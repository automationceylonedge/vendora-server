import { Router } from 'express';
import { payhereNotify } from './payhere.controller.js';

const router = Router();

router.post('/notify', payhereNotify);

export default router;
