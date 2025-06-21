import mongoose from "mongoose";
import { getTextEmbedding, getMultimodalEmbedding } from "./vectorEmbeddings.js";
import Post from "../models/Post.js";
import MediaItem from "../models/MediaItem.js";
import CommunityEvent from "../models/CommunityEvent.js";

/**
 * Generate embeddings for a Post
 */
export async function generatePostEmbeddings(postId: string) {
  try {
    // Type for populated media items
    interface PopulatedMediaItem {
      _id: mongoose.Types.ObjectId;
      uri: string;
      type: string;
      [key: string]: any;
    }

    const post = await Post.findById(postId).populate<{ mediaItems: PopulatedMediaItem[] }>('mediaItems');
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Generate text embedding from post content
    const textContent = [
      post.title || '',
      post.description || '',
      post.tags.join(' '),
      post.aiSummary?.summary || '',
      post.aiSummary?.themes?.join(' ') || '',
      post.aiSummary?.hashtags?.join(' ') || ''
    ].filter(Boolean).join(' ');
    
    const textEmbedding = await getTextEmbedding(textContent);
    
    // Generate multimodal embedding if media exists
    let multimodalEmbedding;
    if (post.mediaItems && post.mediaItems.length > 0) {
      const primaryMedia = post.mediaItems[0];
      const multimodalContext = `${post.title || ''} ${post.description || ''} ${post.tags.join(' ')}`;
      multimodalEmbedding = await getMultimodalEmbedding(primaryMedia.uri, multimodalContext);
    }
    
    // Generate cultural embedding if cultural context exists
    let culturalEmbedding;
    if (post.culturalContext || post.aiSummary?.summaryType === 'cultural') {
      const culturalContent = [
        post.title || '',
        post.culturalContext?.significance || '',
        post.culturalContext?.historicalContext || '',
        post.culturalContext?.preservation || '',
        post.aiSummary?.summary || ''
      ].filter(Boolean).join(' ');
      
      culturalEmbedding = await getTextEmbedding(culturalContent);
    }
    
    // Update post with embeddings
    const updateData: any = {};
    if (textEmbedding) updateData.textEmbedding = textEmbedding;
    if (multimodalEmbedding) updateData.multimodalEmbedding = multimodalEmbedding;
    if (culturalEmbedding) updateData.culturalEmbedding = culturalEmbedding;
    
    if (Object.keys(updateData).length > 0) {
      await Post.findByIdAndUpdate(postId, updateData);
    }
    
    return {
      success: true,
      embeddings: {
        text: !!textEmbedding,
        multimodal: !!multimodalEmbedding,
        cultural: !!culturalEmbedding
      }
    };
  } catch (error) {
    console.error("Error generating post embeddings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Generate embeddings for a MediaItem
 */
export async function generateMediaEmbeddings(mediaId: string) {
  try {
    const media = await MediaItem.findById(mediaId);
    if (!media) {
      throw new Error("Media item not found");
    }
    
    // Generate text embedding
    const textContent = [
      media.title || '',
      media.description || '',
      media.tags?.join(' ') || '',
      media.geminiStory?.story || ''
    ].filter(Boolean).join(' ');
    
    const textEmbedding = await getTextEmbedding(textContent);
    
    // Generate visual embedding
    const visualEmbedding = await getMultimodalEmbedding(media.uri, '');
    
    // Generate multimodal embedding
    const multimodalEmbedding = await getMultimodalEmbedding(
      media.uri,
      textContent
    );
    
    // Generate cultural embedding if applicable
    let culturalEmbedding;
    if (media.culturalContext || (media.geminiStory && 'culturalContext' in media.geminiStory)) {
      const culturalContent = [
        media.title || '',
        media.culturalContext?.significance || '',
        media.geminiStory?.culturalContext || ''
      ].filter(Boolean).join(' ');
      
      culturalEmbedding = await getTextEmbedding(culturalContent);
    }
    
    // Update media with embeddings
    const updateData: any = {};
    if (textEmbedding) updateData.textEmbedding = textEmbedding;
    if (visualEmbedding) updateData.visualEmbedding = visualEmbedding;
    if (multimodalEmbedding) updateData.multimodalEmbedding = multimodalEmbedding;
    if (culturalEmbedding) updateData.culturalEmbedding = culturalEmbedding;
    
    if (Object.keys(updateData).length > 0) {
      await MediaItem.findByIdAndUpdate(mediaId, updateData);
    }
    
    return {
      success: true,
      embeddings: {
        text: !!textEmbedding,
        visual: !!visualEmbedding,
        multimodal: !!multimodalEmbedding,
        cultural: !!culturalEmbedding
      }
    };
  } catch (error) {
    console.error("Error generating media embeddings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Generate embeddings for a CommunityEvent
 */
export async function generateEventEmbeddings(eventId: string) {
  try {
    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Generate text embedding
    const textContent = [
      event.name,
      event.description || '',
      event.eventType,
      event.tags.join(' '),
      event.culturalTags.join(' '),
      event.aiSummary?.summary || '',
      event.aiSummary?.highlights?.join(' ') || '',
      event.culturalSignificance?.heritage || ''
    ].filter(Boolean).join(' ');
    
    const textEmbedding = await getTextEmbedding(textContent);
    
    // Generate cultural embedding
    let culturalEmbedding;
    if (
      event.culturalSignificance || 
      event.aiSummary?.summary ||
      event.culturalTags.length > 0
    ) {
      const culturalContent = [
        event.name,
        event.culturalSignificance?.heritage || '',
        event.culturalSignificance?.communityValue || '',
        event.culturalTags.join(' '),
        event.aiSummary?.summary || ''
      ].filter(Boolean).join(' ');
      
      culturalEmbedding = await getTextEmbedding(culturalContent);
    }
    
    // Update event with embeddings
    const updateData: any = {};
    if (textEmbedding) updateData.textEmbedding = textEmbedding;
    if (culturalEmbedding) updateData.culturalEmbedding = culturalEmbedding;
    
    if (Object.keys(updateData).length > 0) {
      await CommunityEvent.findByIdAndUpdate(eventId, updateData);
    }
    
    return {
      success: true,
      embeddings: {
        text: !!textEmbedding,
        cultural: !!culturalEmbedding
      }
    };
  } catch (error) {
    console.error("Error generating event embeddings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Batch process posts to generate embeddings
 */
export async function batchGeneratePostEmbeddings(limit = 20) {
  try {
    // Find posts without embeddings
    const posts = await Post.find({
      $or: [
        { textEmbedding: { $exists: false } },
        { textEmbedding: null },
        { textEmbedding: { $size: 0 } }
      ]
    }).limit(limit);
    
    console.log(`Processing ${posts.length} posts for vector embeddings`);
    
    const results = [];
    for (const post of posts) {
      try {
        const result = await generatePostEmbeddings(post._id.toString());
        results.push({
          postId: post._id,
          success: result.success
        });
      } catch (error) {
        console.error(`Error processing post ${post._id}:`, error);
        results.push({
          postId: post._id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      processed: posts.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  } catch (error) {
    console.error("Error in batch processing:", error);
    throw error;
  }
}
