import { Request, Response } from 'express';
import { createAllVectorIndexes } from '../utils/bengaliVectorIndexes.js';
import { 
  findSimilarPosts,
  findSimilarEvents,
  findSimilarMedia,
  findCulturalContent
} from '../utils/bengaliVectorQueries.js';
import { 
  generatePostEmbeddings,
  generateMediaEmbeddings,
  generateEventEmbeddings,
  batchGeneratePostEmbeddings 
} from '../utils/bengaliVectorGenerator.js';
import Post from '../models/Post.js';

/**
 * Initialize vector indexes for Bengali Heritage platform
 */
export const initializeVectorIndexes = async (req: Request, res: Response) => {
  try {    // Verify admin permissions
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const result = await createAllVectorIndexes();
    
    if (result.success) {
      return res.status(200).json({
        message: 'Bengali Heritage vector indexes initialized successfully'
      });
    } else {
      return res.status(500).json({
        message: 'Failed to initialize vector indexes',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error initializing vector indexes:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Find similar posts using vector search
 */
export const searchSimilarPosts = async (req: Request, res: Response) => {
  try {
    const { 
      postId, 
      query, 
      embedType = 'text',
      userId,
      tags,
      summaryType,
      limit = 10,
      minScore = 0.7
    } = req.body;
    
    // Validate request
    if (!postId && !query) {
      return res.status(400).json({ 
        message: 'Either postId or query is required' 
      });
    }
    
    const results = await findSimilarPosts({
      postId,
      query,
      embedType: embedType as 'text' | 'multimodal' | 'cultural',
      userId,
      tags: Array.isArray(tags) ? tags : tags?.split(','),
      summaryType,
      limit: Number(limit),
      minScore: Number(minScore)
    });
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error finding similar posts:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Find similar events using vector search
 */
export const searchSimilarEvents = async (req: Request, res: Response) => {
  try {
    const { 
      eventId, 
      query, 
      embedType = 'text',
      eventType,
      tags,
      culturalTags,
      upcoming = true,
      limit = 10,
      minScore = 0.7
    } = req.body;
    
    // Validate request
    if (!eventId && !query) {
      return res.status(400).json({ 
        message: 'Either eventId or query is required' 
      });
    }
    
    const results = await findSimilarEvents({
      eventId,
      query,
      embedType: embedType as 'text' | 'cultural',
      eventType,
      tags: Array.isArray(tags) ? tags : tags?.split(','),
      culturalTags: Array.isArray(culturalTags) ? culturalTags : culturalTags?.split(','),
      upcoming: upcoming === true || upcoming === 'true',
      limit: Number(limit),
      minScore: Number(minScore)
    });
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error finding similar events:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Find similar media using vector search
 */
export const searchSimilarMedia = async (req: Request, res: Response) => {
  try {
    const { 
      mediaId, 
      query,
      imageUrl,
      embedType = 'multimodal',
      mediaType,
      tags,
      limit = 10,
      minScore = 0.7
    } = req.body;
    
    // Validate request
    if (!mediaId && !query && !imageUrl) {
      return res.status(400).json({ 
        message: 'Either mediaId, query, or imageUrl is required' 
      });
    }
    
    const results = await findSimilarMedia({
      mediaId,
      query,
      imageUrl,
      embedType: embedType as 'visual' | 'text' | 'multimodal' | 'cultural',
      mediaType,
      tags: Array.isArray(tags) ? tags : tags?.split(','),
      limit: Number(limit),
      minScore: Number(minScore)
    });
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error finding similar media:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Find culturally relevant Bengali content
 */
export const searchCulturallyRelevantContent = async (req: Request, res: Response) => {
  try {
    const { 
      query,
      culturalTheme,
      includeEvents = true,
      includePosts = true,
      includeMedia = true,
      limit = 15
    } = req.body;
    
    // Validate request
    if (!query) {
      return res.status(400).json({ 
        message: 'Query is required' 
      });
    }
    
    const results = await findCulturalContent({
      query,
      culturalTheme,
      includeEvents: includeEvents === true || includeEvents === 'true',
      includePosts: includePosts === true || includePosts === 'true',
      includeMedia: includeMedia === true || includeMedia === 'true',
      limit: Number(limit)
    });
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error finding culturally relevant content:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Generate embeddings for a post
 */
export const generatePostEmbeddingsController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }
    
    const result = await generatePostEmbeddings(postId);
    
    if (result.success) {
      res.status(200).json({
        message: 'Post embeddings generated successfully',
        embeddings: result.embeddings
      });
    } else {
      res.status(500).json({
        message: 'Failed to generate post embeddings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating post embeddings:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Generate embeddings for a media item
 */
export const generateMediaEmbeddingsController = async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.params;
    
    if (!mediaId) {
      return res.status(400).json({ message: 'Media ID is required' });
    }
    
    const result = await generateMediaEmbeddings(mediaId);
    
    if (result.success) {
      res.status(200).json({
        message: 'Media embeddings generated successfully',
        embeddings: result.embeddings
      });
    } else {
      res.status(500).json({
        message: 'Failed to generate media embeddings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating media embeddings:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Generate embeddings for an event
 */
export const generateEventEmbeddingsController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }
    
    const result = await generateEventEmbeddings(eventId);
    
    if (result.success) {
      res.status(200).json({
        message: 'Event embeddings generated successfully',
        embeddings: result.embeddings
      });
    } else {
      res.status(500).json({
        message: 'Failed to generate event embeddings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating event embeddings:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Batch process posts to generate embeddings
 */
export const batchProcessPostsController = async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.body;
    
    const result = await batchGeneratePostEmbeddings(Number(limit));
    
    res.status(200).json({
      message: `Processed ${result.successful} posts successfully, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    console.error('Error batch processing posts:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Find similar posts by post ID
 */
export const searchSimilarPostsByPostId = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const limit = parseInt((req.query.limit as string) || '10');
  const minScore = parseFloat((req.query.minScore as string) || '0.7');

  // Fetch the selected post with location
  const selectedPost = await Post.findById(postId);
  if (!selectedPost) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const selectedLocation = selectedPost.location && selectedPost.location.coordinates;

  // Try all embedding types and merge results
  const embeddingTypes: Array<'text' | 'multimodal' | 'cultural'> = ['text', 'multimodal', 'cultural'];
  let allResults: any[] = [];
  for (const embedType of embeddingTypes) {
    try {
      const result = await findSimilarPosts({ postId, embedType, limit: limit * 2, minScore });
      if (result && result.posts) {
        allResults = allResults.concat(result.posts);
      }
    } catch (e) {
      // Ignore missing embedding type
    }
  }
  // Remove duplicates by _id
  const uniqueResults = Object.values(
    allResults.reduce((acc, post) => {
      acc[String(post._id)] = post;
      return acc;
    }, {} as Record<string, any>)
  );

  // Calculate location distance (Haversine formula)
  function getDistanceKm(coords1?: number[], coords2?: number[]) {
    if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) return Number.MAX_VALUE;
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Attach distance to each post
  const postsWithDistance = (uniqueResults as any[]).map((post: any) => ({
    ...post,
    locationDistance: getDistanceKm(selectedLocation, post.location && post.location.coordinates)
  }));

  // Sort by location distance (ascending)
  postsWithDistance.sort((a, b) => a.locationDistance - b.locationDistance);

  // Remove the selected post from results if present
  const filtered = postsWithDistance.filter(p => String(p._id) !== String(postId));

  res.json({
    selectedPost,
    similarPosts: filtered.slice(0, limit),
    count: filtered.length
  });
};
