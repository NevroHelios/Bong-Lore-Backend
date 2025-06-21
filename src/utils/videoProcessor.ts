import * as fs from 'fs';
import * as path from 'path';
import { uploadtocloudinary } from '../cloudconfig.js';
import MediaItem from '../models/MediaItem.js';
import { extractVideoHighlights } from './videoHighlights.js';

interface ProcessedVideoResult {
  success: boolean;
  mediaItem?: any;
  originalVideoUrl?: string;
  highlightsVideoUrl?: string;
  message?: string;
}

/**
 * Complete workflow: Extract video highlights → Upload to Cloudinary → Save to DB
 * 
 * @param cloudinaryUrl Original video URL from Cloudinary
 * @param userId User ID who owns the video
 * @param title Optional title for the highlights video
 * @param description Optional description
 * @returns ProcessedVideoResult with MediaItem data
 */
export async function processAndSaveVideoHighlights(
  cloudinaryUrl: string,
  userId: string,
  title?: string,
  description?: string
): Promise<ProcessedVideoResult> {
  try {
    console.log('🎬 Starting complete video processing workflow...');
    
    // Step 1: Extract video highlights (creates local file)
    console.log('📹 Extracting video highlights...');
    const highlightsLocalPath = await extractVideoHighlights(cloudinaryUrl);
    
    if (!fs.existsSync(highlightsLocalPath)) {
      throw new Error('Highlights video file was not created');
    }
    
    // Get file stats
    const stats = fs.statSync(highlightsLocalPath);
    const fileSizeBytes = stats.size;
    const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Highlights video created: ${path.basename(highlightsLocalPath)} (${fileSizeMB} MB)`);
    
    // Step 2: Upload highlights video to Cloudinary
    console.log('☁️ Uploading highlights to Cloudinary...');
    const uploadResult = await uploadtocloudinary(highlightsLocalPath);
    
    if (uploadResult.message !== 'Success') {
      throw new Error('Failed to upload highlights video to Cloudinary');
    }
    
    const cloudinaryResult = uploadResult.result;
    if (!cloudinaryResult) {
      throw new Error('Cloudinary upload result is undefined');
    }
    console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);
    
    // Step 3: Create MediaItem in database
    console.log('💾 Saving MediaItem to database...');
    
    const mediaItem = new MediaItem({
      userId: userId,
      uri: cloudinaryResult.secure_url,
      type: 'video',
      timestamp: Date.now(),
      title: title || 'Video Highlights',
      description: description || 'AI-generated video highlights',
      likes: [],
      comments: [],
      collections: [],
      featured: false,
      
      // Add metadata
      aspectRatio: cloudinaryResult.width && cloudinaryResult.height ? 
        cloudinaryResult.width / cloudinaryResult.height : undefined,
      
      // AI Summary for highlights
      aiSummary: {
        summary: 'AI-generated video highlights showcasing the most engaging moments',
        hashtags: ['highlights', 'video', 'ai-generated'],
        mood: 'engaging',
        themes: ['video-editing', 'highlights'],
        generatedAt: new Date(),
        summaryType: 'media'
      }
    });
    
    const savedMediaItem = await mediaItem.save();
    console.log(`✅ MediaItem saved with ID: ${savedMediaItem._id}`);
    
    // Clean up local file if it still exists
    try {
      if (fs.existsSync(highlightsLocalPath)) {
        fs.unlinkSync(highlightsLocalPath);
        console.log('🧹 Cleaned up local highlights file');
      }
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up local file:', cleanupError);
    }
    
    return {
      success: true,
      mediaItem: {
        _id: savedMediaItem._id,
        uri: savedMediaItem.uri,
        type: savedMediaItem.type,
        title: savedMediaItem.title,
        description: savedMediaItem.description,
        timestamp: savedMediaItem.timestamp,
        aspectRatio: savedMediaItem.aspectRatio,
        aiSummary: savedMediaItem.aiSummary,
        likes: savedMediaItem.likes,
        comments: savedMediaItem.comments
      },
      originalVideoUrl: cloudinaryUrl,
      highlightsVideoUrl: cloudinaryResult.secure_url,
      message: 'Video highlights processed and saved successfully'
    };
    
  } catch (error) {
    console.error('❌ Error in video processing workflow:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get MediaItem by ID for frontend display
 * 
 * @param mediaItemId MongoDB ObjectId of the MediaItem
 * @returns MediaItem data formatted for frontend
 */
export async function getMediaItemForDisplay(mediaItemId: string) {
  try {
    const mediaItem = await MediaItem.findById(mediaItemId)
      .populate('userId', 'name email') // Populate user info if needed
      .lean(); // Return plain JavaScript object
    
    if (!mediaItem) {
      return { success: false, message: 'MediaItem not found' };
    }
    
    return {
      success: true,
      data: {
        _id: mediaItem._id,
        uri: mediaItem.uri,
        type: mediaItem.type,
        title: mediaItem.title,
        description: mediaItem.description,
        timestamp: mediaItem.timestamp,
        aspectRatio: mediaItem.aspectRatio,
        likes: mediaItem.likes?.length || 0,
        comments: mediaItem.comments?.length || 0,
        aiSummary: mediaItem.aiSummary,
        user: mediaItem.userId // Populated user data
      }
    };
    
  } catch (error) {
    console.error('Error fetching MediaItem:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch MediaItem'
    };
  }
}

/**
 * Get all video highlights for a user
 * 
 * @param userId User ID
 * @returns Array of video MediaItems
 */
export async function getUserVideoHighlights(userId: string) {
  try {
    const videoItems = await MediaItem.find({
      userId: userId,
      type: 'video',
      'aiSummary.themes': 'highlights' // Filter for highlights videos
    })
    .sort({ timestamp: -1 }) // Most recent first
    .lean();
    
    return {
      success: true,
      data: videoItems.map(item => ({
        _id: item._id,
        uri: item.uri,
        title: item.title,
        description: item.description,
        timestamp: item.timestamp,
        aspectRatio: item.aspectRatio,
        likes: item.likes?.length || 0,
        comments: item.comments?.length || 0
      }))
    };
    
  } catch (error) {
    console.error('Error fetching user video highlights:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch video highlights'
    };
  }
}
