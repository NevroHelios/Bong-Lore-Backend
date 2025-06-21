import { Router, Request, Response, NextFunction } from 'express';
import { 
  initializeVectorIndexes,
  searchSimilarPosts,
  searchSimilarEvents,
  searchSimilarMedia,
  searchCulturallyRelevantContent,
  generatePostEmbeddingsController,
  generateMediaEmbeddingsController,
  generateEventEmbeddingsController,
  batchProcessPostsController,
  searchSimilarPostsByPostId
} from '../controllers/vectorSearchController.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

// Middleware for async error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Admin auth middleware
const adminAuth = (req: any, res: any, next: any) => {
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    
    // In the future, you can add admin role check here
    // Example: if (req.user && (req.user as Express.User).role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    next();
  });
};

// Initialize vector indexes (admin only)
router.post('/initialize', adminAuth, asyncHandler(initializeVectorIndexes));

// Search endpoints (public)
router.post('/search/posts', asyncHandler(searchSimilarPosts));
router.post('/search/events', asyncHandler(searchSimilarEvents));
router.post('/search/media', asyncHandler(searchSimilarMedia));
router.post('/search/cultural', asyncHandler(searchCulturallyRelevantContent));
// Search for similar posts to a given postId (public)
router.get('/search/similar/:postId', asyncHandler(searchSimilarPostsByPostId));

// Generate embeddings (admin only)
router.post('/embeddings/post/:postId', adminAuth, asyncHandler(generatePostEmbeddingsController));
router.post('/embeddings/media/:mediaId', adminAuth, asyncHandler(generateMediaEmbeddingsController));
router.post('/embeddings/event/:eventId', adminAuth, asyncHandler(generateEventEmbeddingsController));
router.post('/embeddings/batch/posts', adminAuth, asyncHandler(batchProcessPostsController));

export default router;
