import { Router } from 'express';
import postroutes from './postroutes.js';
import eventroutes from './communityEventRoutes.js';
import collectionroutes from './collectionroutes.js';
import quizRoutes from './quizroutes.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Include post routes (they will be available at /api/posts/*)
router.use('/posts', postroutes);

// Include event routes (they will be available at /api/events/*)
router.use('/events', eventroutes);

// Include collection routes (they will be available at /api/collections/*)
router.use('/collections', collectionroutes);

// Include quiz routes (they will be available at /api/quiz/*)
router.use('/quiz', quizRoutes);

export default router;
