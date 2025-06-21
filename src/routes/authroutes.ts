import { Request, Response, Router } from 'express';
import { 
  register, 
  login,
  getCurrentUser, 
} from '../controllers/authcontroller.js';

const router = Router();

// Async handler utility
const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register a new user
router.post('/register', asyncHandler(register));

// Login a user
router.post('/login', asyncHandler(login));

// Get current user info (requires token)
router.get('/me', asyncHandler(getCurrentUser));

export default router;