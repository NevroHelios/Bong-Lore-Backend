import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-random';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // This allows unauthenticated requests to proceed.
    // The route handler will be responsible for checking if req.user exists.
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('-password'); // Exclude password from the user object

    if (user) {
      (req as any).user = user; // Attach user to the request object
    }
  } catch (error) {
    // If token is invalid or expired, do nothing.
    // The user will not be authenticated.
    if (error instanceof Error) {
      console.log('JWT verification failed:', error.message);
    } else {
      console.log('JWT verification failed with unknown error type.');
    }
  }
  
  next();
};

// A stricter middleware that requires authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  next();
};
