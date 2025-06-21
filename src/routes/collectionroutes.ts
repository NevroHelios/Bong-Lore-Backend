import { Router, Request, Response } from "express";
const router = Router();
import { 
  createCollection,
  getCollections,
  getCollectionByIdOrSlug,
  addMediaToCollection,
  removeMediaFromCollection,
  generateCollectionSummary,
  joinCollection,
  leaveCollection,
  createEventCollection,
  getEventCollections,
  addPostsToEventCollection
} from "../controllers/collectioncontroller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Auth wrapper for protected routes
const withAuth = (fn: Function) => (req: Request, res: Response, next: (err?: any) => void) => {
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    return asyncHandler(fn)(req, res, next);
  });
};

// Get all collections (public, filterable)
router.get("/", asyncHandler(getCollections));

// Get a collection by ID or slug
router.get("/:identifier", asyncHandler(getCollectionByIdOrSlug));

// Create a new collection (protected)
router.post("/create", withAuth(createCollection));

// Add media to collection (protected)
router.post("/:collectionId/media", withAuth(addMediaToCollection));

// Remove media from collection (protected)
router.delete("/:collectionId/media/:mediaId", withAuth(removeMediaFromCollection));

// Generate collection summary (protected)
router.post("/generate-summary", withAuth(generateCollectionSummary));

// Join a collection (protected)
router.post("/:collectionId/join", withAuth(joinCollection));

// Leave a collection (protected)
router.post("/:collectionId/leave", withAuth(leaveCollection));

// Event collection routes
router.post("/event/:eventId", withAuth(createEventCollection));
router.get("/event/:eventId", asyncHandler(getEventCollections));
router.post("/:collectionId/posts", withAuth(addPostsToEventCollection));

export default router;
