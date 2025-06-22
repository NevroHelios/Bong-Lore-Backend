import express from 'express';
import multer from 'multer';
import { addPostToEvent, getEventPosts, createCommunityEvent, joinEvent, leaveEvent, getEventDetails, getAllCommunityEvents } from '../controllers/communityEventController.js';

const router = express.Router();
const upload = multer();

// Route to create a new event
router.post('/events/createevent', upload.single('coverImage'), createCommunityEvent);

// Route to add a post to an event
router.post('/events/:eventId/posts', addPostToEvent);

// Route to get all posts for a specific event
router.get('/events/:eventId/posts', getEventPosts);

// Route to join an event
router.post('/events/:eventId/join', joinEvent);

// Route to leave an event
router.post('/events/:eventId/leave', leaveEvent);

// Route to get event details
router.get('/events/:eventId/details', getEventDetails);

// Route to get all community events
router.get('/events', getAllCommunityEvents);

export default router;