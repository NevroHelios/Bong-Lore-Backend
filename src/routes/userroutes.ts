import { Router } from 'express';
import { toggleBookmark, getBookmarkedPosts } from '../controllers/usercontroller.js';
import { authMiddleware, requireAuth } from '../middlewares/authmiddleware.js';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.patch(
    '/bookmarks/:postId',
    authMiddleware,
    requireAuth,
    asyncHandler(toggleBookmark)
);

router.get(
    '/bookmarks',
    authMiddleware,
    requireAuth,
    asyncHandler(getBookmarkedPosts)
);

export default router; 