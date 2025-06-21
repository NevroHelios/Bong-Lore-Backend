import geminiVision from './geminiVision.js';
import mongoose from 'mongoose';
import MediaItem from '../models/MediaItem.js';
import Tag from '../models/Tag.js';

// Destructure the imported functions and constants
const { 
  generateTagsForMedia,
  generateStoryForMedia,
  ALL_BENGALI_TAGS, 
  BENGALI_CULTURE_TAGS 
} = geminiVision;

/**
 * Process a new media item with Gemini Vision
 * - Analyzes the media (image/video)
 * - Generates tags
 * - Creates a story/description
 * - Updates the media item with this information
 */
export async function processMediaWithGemini(
  mediaId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<any> {
  try {
    // Find the media item
    const media = await MediaItem.findById(mediaId);
    if (!media) {
      throw new Error(`Media item not found: ${mediaId}`);
    }
    
    // Get the file path (assuming media.uri contains the path or URL)
    const filePath = media.uri;
    
    // Generate tags using Gemini Vision
    console.log(`Generating tags for media: ${mediaId}`);
    const tags = await generateTagsForMedia(filePath, userId, media.description);
    
    // Generate story using Gemini Vision
    console.log(`Generating story for media: ${mediaId}`);
    const story = await generateStoryForMedia(filePath, tags, media.description);
    
    // Update media item with tags and story
    const updateData: any = {
      tags,
      geminiStory: story
    };
    
    // If media doesn't have a title yet, use the title from the story
    if (!media.title && story.title) {
      updateData.title = story.title;
    }
    
    // Update the media item
    const updatedMedia = await MediaItem.findByIdAndUpdate(
      mediaId,
      updateData,
      { new: true }
    );
    
    return {
      success: true,
      media: updatedMedia,
      tags,
      story
    };
  } catch (error) {
    console.error('Error processing media with Gemini:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Function to suggest relevant Bengali culture tags based on text input
 * Useful for search or manual tagging
 */
export async function suggestBengaliTags(
  searchText: string,
  limit: number = 10
): Promise<string[]> {
  // Simple tag suggestion based on text matching
  const normalizedSearch = searchText.toLowerCase().trim();
  
  // First try to find exact or partial matches in our predefined tags
  const matchedTags = ALL_BENGALI_TAGS.filter(tag =>
    tag.toLowerCase().includes(normalizedSearch) ||
    tag.replace(/-/g, ' ').toLowerCase().includes(normalizedSearch)
  );
  
  // If we have enough matches from our predefined list, return those
  if (matchedTags.length >= limit) {
    return matchedTags.slice(0, limit);
  }
  
  // Otherwise, also look for matches in the database
  try {
    const dbTags = await Tag.find(
      { name: { $regex: searchText, $options: 'i' } },
      { name: 1, _id: 0 }
    )
      .sort({ useCount: -1 })
      .limit(limit - matchedTags.length);
    
    // Combine matches from predefined tags and database
    const dbTagNames = dbTags.map(tag => tag.name);
    const combinedTags = [...new Set([...matchedTags, ...dbTagNames])];
    
    return combinedTags.slice(0, limit);
  } catch (error) {
    console.error('Error suggesting tags:', error);
    return matchedTags.slice(0, limit);
  }
}

export default {
  processMediaWithGemini,
  suggestBengaliTags,
  ALL_BENGALI_TAGS,
  BENGALI_CULTURE_TAGS
};
