import { Router, Request, Response } from "express";
const router = Router();
import { 
  createCommunityEvent,
  generateEventSummary,
  getEvents,
  getEventById,
  joinEvent,
  leaveEvent,
  getEventWithCollections
} from "../controllers/eventcontroller.js";
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

// Get all events (public, filterable)
router.get("/", asyncHandler(getEvents));

// Get a single event by ID
router.get("/:eventId", asyncHandler(getEventById));

// Create community event (protected)
router.post("/create", withAuth(createCommunityEvent));

// Generate summary for community event (protected)
router.post("/:eventId/generate-summary", withAuth(generateEventSummary));

// Join an event (protected)
router.post("/:eventId/join", withAuth(joinEvent));

// Leave an event (protected)
router.post("/:eventId/leave", withAuth(leaveEvent));

// Get a single event with its collections
router.get("/:eventId/withCollections", asyncHandler(getEventWithCollections));

export default router;
