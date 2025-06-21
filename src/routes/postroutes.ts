import { Router, Request, Response } from "express";
const router = Router();
import multer from "multer";
const upload = multer({ dest: 'uploads/' })
import { 
  createposts, 
  getPosts, 
  generatePostSummaryEndpoint,
  getNearbyPosts,
  createPost
} from "../controllers/postcontroller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a wrapper that properly types the request
const createPostsWrapper = (req: Request, res: Response, next: (err?: any) => void) => {
  // Cast req to include files from multer
  const multerReq = req as Request & { files?: Express.Multer.File[] };
  Promise.resolve(createposts(multerReq, res)).catch(next);
};

// Create a wrapper that properly types the request for single file
const createPostWrapper = (req: Request, res: Response, next: (err?: any) => void) => {
  // Cast req to include files from multer
  const multerReq = req as Request & { files?: Express.Multer.File[] };
  Promise.resolve(createPost(multerReq, res)).catch(next);
};

// Auth wrapper for protected routes
const withAuth = (fn: Function) => (req: Request, res: Response, next: (err?: any) => void) => {
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    return asyncHandler(fn)(req, res, next);
  });
};

// Routes
router.post("/createpost", upload.array('mediaFiles', 20), asyncHandler(createPostsWrapper));
router.post("/createpost", upload.single('media'), asyncHandler(createPostWrapper));

// Get posts with filtering options
router.get("/", asyncHandler(getPosts));

// Generate summary for existing post (protected)
router.get("/:postId/generate-summary", withAuth(generatePostSummaryEndpoint));

// Get posts near the user's location (protected)
router.get("/nearby", withAuth(getNearbyPosts));

export default router;