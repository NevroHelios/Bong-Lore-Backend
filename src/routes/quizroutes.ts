import { Router } from 'express';
import { getQuizQuestion, submitQuizAnswer, getLeaderboard } from '../controllers/quizcontroller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

router.get('/question', authMiddleware, getQuizQuestion);
router.post('/answer', authMiddleware, submitQuizAnswer);
router.get('/leaderboard', authMiddleware, getLeaderboard);

export default router;
