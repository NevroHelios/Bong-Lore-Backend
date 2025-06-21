import { Router } from 'express';
import { getPopularTagsController } from '../controllers/tagcontroller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

router.get('/popular', authMiddleware, getPopularTagsController);

export default router;
