import { Router, Request, Response, NextFunction } from 'express';
import { processMediaWithGemini, suggestBengaliTags } from '../utils/mediaProcessor.js';
import { extractVideoHighlights } from '../utils/videoHighlights.js';
import { processAndSaveVideoHighlights, getMediaItemForDisplay, getUserVideoHighlights } from '../utils/videoProcessor.js';
import { Types } from 'mongoose';
import MediaItem from '../models/MediaItem.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

// Helper function for processing media
async function processMedia(req: Request, res: Response): Promise<void> {
  try {
    const { mediaId } = req.params;
      // Get user info from Passport
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      return;
    }
    
    const user = req.user as Express.User;
    
    // Use the user's ID
    const userId = String(user._id);
    
    // Check if media exists and belongs to the user
    const mediaItem = await MediaItem.findOne({
      _id: mediaId,
      userId
    });
    
    if (!mediaItem) {
      res.status(404).json({ error: 'Media item not found or access denied' });
      return;
    }
    
    // Process with Gemini
    const result = await processMediaWithGemini(mediaId, userId);
    
    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }
    
    res.status(200).json({
      message: 'Media processed successfully',
      media: result.media,
      tags: result.tags,
      story: result.story
    });
  } catch (error) {
    console.error('Error processing media:', error);
    res.status(500).json({ 
      error: 'Failed to process media',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper function for suggesting tags
async function suggestTags(req: Request, res: Response): Promise<void> {
  try {
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    
    const limitNum = limit ? parseInt(limit as string) : 10;
    const tags = await suggestBengaliTags(query, limitNum);
    
    res.status(200).json({ tags });
  } catch (error) {
    console.error('Error suggesting tags:', error);
    res.status(500).json({ 
      error: 'Failed to suggest tags',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper function for extracting video highlights
async function createVideoHighlights(req: Request, res: Response): Promise<void> {
  try {
    const { cloudinaryUrl, outputDir, outputFilename } = req.body;
    
    // Validate required fields
    if (!cloudinaryUrl) {
      res.status(400).json({ 
        error: 'cloudinaryUrl is required',
        example: {
          cloudinaryUrl: "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/sample.mp4",
          outputDir: "/optional/output/directory",
          outputFilename: "optional-filename.mp4"
        }
      });
      return;
    }
    
    // Get user info from Passport (optional - remove if not needed)
    const user = req.user;
    const userId = user ? String(user._id || user.email || 'unknown') : 'anonymous';
    
    console.log(`Creating video highlights for user: ${userId}`);
    console.log(`Processing video: ${cloudinaryUrl}`);
    
    // Extract video highlights
    const highlightsPath = await extractVideoHighlights(
      cloudinaryUrl,
      undefined, // Use environment variable for API key
      outputDir,
      outputFilename
    );
    
    res.status(200).json({
      message: 'Video highlights created successfully',
      highlightsPath,
      originalVideo: cloudinaryUrl,
      createdAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error creating video highlights:', error);
    res.status(500).json({ 
      error: 'Failed to create video highlights',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Create a wrapped middleware function that handles async correctly
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom auth wrapper
const withAuth = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    return asyncHandler(fn)(req, res, next);
  });
};

// Process a media item with Gemini Vision
router.post('/media/:mediaId/process', withAuth(processMedia));

// Create video highlights from a Cloudinary video URL
router.post('/video/highlights', asyncHandler(createVideoHighlights));

// NEW: Complete video processing workflow - Extract highlights + Upload + Save to DB
router.post('/video/process-complete', withAuth(async (req: Request, res: Response): Promise<void> => {
  try {
    const { cloudinaryUrl, title, description } = req.body;
    
    // Validate required fields
    if (!cloudinaryUrl) {
      res.status(400).json({ 
        error: 'cloudinaryUrl is required',
        example: {
          cloudinaryUrl: "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/sample.mp4",
          title: "Optional video title",
          description: "Optional video description"
        }
      });
      return;
    }
    
    // Get user info from Passport
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      return;
    }
    
    const userId = String(user._id || user.email || 'unknown');
    console.log(`Processing complete video workflow for user: ${userId}`);
    
    // Process video: Extract highlights + Upload + Save to DB
    const result = await processAndSaveVideoHighlights(
      cloudinaryUrl,
      userId,
      title,
      description
    );
    
    if (result.success) {
      res.status(200).json({
        message: 'Video highlights processed and saved successfully',
        data: result.mediaItem,
        originalVideoUrl: result.originalVideoUrl,
        highlightsVideoUrl: result.highlightsVideoUrl,
        createdAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Failed to process video highlights',
        details: result.message
      });
    }
    
  } catch (error) {
    console.error('Error in complete video processing:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// NEW: Get MediaItem by ID for frontend display
router.get('/media/:mediaItemId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaItemId } = req.params;
    
    const result = await getMediaItemForDisplay(mediaItemId);
    
    if (result.success) {
      res.status(200).json({
        message: 'MediaItem retrieved successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        error: 'MediaItem not found',
        details: result.message
      });
    }
    
  } catch (error) {
    console.error('Error fetching MediaItem:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// NEW: Get all video highlights for a user
router.get('/user/video-highlights', withAuth(async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user info from Passport
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      return;
    }
    
    const userId = String(user._id || user.email || 'unknown');
    
    const result = await getUserVideoHighlights(userId);
    
    if (result.success) {
      res.status(200).json({
        message: 'Video highlights retrieved successfully',
        data: result.data,
        count: result.data?.length || 0
      });
    } else {
      res.status(500).json({
        error: 'Failed to retrieve video highlights',
        details: result.message
      });
    }
    
  } catch (error) {
    console.error('Error fetching user video highlights:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get tag suggestions
router.get('/tags/suggest', asyncHandler(suggestTags));

export default router;