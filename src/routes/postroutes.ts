import { Router, Request, Response } from "express";
const router = Router();
import multer from "multer";
const upload = multer({ dest: 'uploads/' })
import { 
  createposts, 
  getPosts, 
  generatePostSummaryEndpoint,
  getNearbyPosts,
  createPost,
  toggleLike,
  addComment
} from "../controllers/postcontroller.js";
import { authMiddleware, requireAuth } from "../middlewares/authmiddleware.js";

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a wrapper that properly types the request
const createPostsWrapper = (req: Request, res: Response, next: (err?: any) => void) => {
  // Cast req to include files from multer
  const multerReq = req as Request & { files?: Express.Multer.File[] };
  Promise.resolve(createposts(multerReq, res)).catch(next);
};

// Routes
router.post(
  "/createpost", 
  authMiddleware, 
  requireAuth,
  upload.array('media', 20), 
  asyncHandler(createPostsWrapper)
);

// Get posts with filtering options
router.get("/", asyncHandler(getPosts));

// Generate summary for existing post (protected)
router.get("/:postId/generate-summary", authMiddleware, requireAuth, asyncHandler(generatePostSummaryEndpoint));

// Toggle like on a post
router.patch("/:postId/like", authMiddleware, requireAuth, asyncHandler(toggleLike));

// Add a comment to a post
router.post("/:postId/comments", authMiddleware, requireAuth, asyncHandler(addComment));

// Get posts near the user's location (protected)
router.get("/nearby", authMiddleware, requireAuth, asyncHandler(getNearbyPosts));

export default router;