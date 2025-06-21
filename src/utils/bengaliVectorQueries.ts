import mongoose from "mongoose";
import { getTextEmbedding, getMultimodalEmbedding } from "./vectorEmbeddings.js";
import Post from "../models/Post.js";
import MediaItem from "../models/MediaItem.js";
import CommunityEvent from "../models/CommunityEvent.js";
import { getMongoConnection } from "./bengaliVectorIndexes.js";

/**
 * Find similar posts based on vector embedding
 */
export async function findSimilarPosts(options: {
  postId?: string;
  query?: string;
  embedType?: 'text' | 'multimodal' | 'cultural';
  userId?: string;
  tags?: string[];
  summaryType?: string;
  limit?: number;
  minScore?: number;
}) {
  const { 
    postId, 
    query, 
    embedType = 'text', 
    userId, 
    tags, 
    summaryType,
    limit = 10, 
    minScore = 0.7 
  } = options;
  
  if (!postId && !query) {
    throw new Error("Either postId or query is required");
  }
  
  let queryVector: number[];
  
  // Get query vector from post or generate from text query
  if (postId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    const embeddingField = `${embedType}Embedding`;
    queryVector = post[embeddingField as keyof typeof post] as number[];
    
    if (!queryVector || queryVector.length === 0) {
      throw new Error(`Post does not have ${embedType} embedding`);
    }
  } else if (query) {
    // Generate embedding based on embed type
    queryVector = await getTextEmbedding(query);
  } else {
    throw new Error("Invalid search parameters");
  }
  
  // Execute vector search
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("posts");
    
    // Build filters
    const filter: any = { visibility: "public" };
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    if (tags && tags.length > 0) filter.tags = { $in: tags };
    if (summaryType) filter["aiSummary.summaryType"] = summaryType;
    
    // Determine the embedding field to search
    const embedField = `${embedType}Embedding`;
    
    // Build aggregation pipeline with vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "bengaliPostVectorIndex",
          path: embedField,
          queryVector: queryVector,
          numCandidates: limit * 3,
          limit: limit,
          filter: filter
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          tags: 1,
          mediaItems: 1,
          aiSummary: 1,
          culturalContext: 1,
          creativeContext: 1,
          travelContext: 1,
          userId: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $match: {
          score: { $gte: minScore }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "mediaitems",
          localField: "mediaItems",
          foreignField: "_id",
          as: "mediaItems"
        }
      }
    ];
    
    const cursor = collection.aggregate(pipeline);
    const results = await cursor.toArray();
    
    return {
      posts: results,
      count: results.length
    };
  } catch (error) {
    console.error("Error finding similar posts:", error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Find similar events based on vector embedding
 */
export async function findSimilarEvents(options: {
  eventId?: string;
  query?: string;
  embedType?: 'text' | 'cultural';
  eventType?: string;
  tags?: string[];
  culturalTags?: string[];
  upcoming?: boolean;
  limit?: number;
  minScore?: number;
}) {
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
  } = options;
  
  if (!eventId && !query) {
    throw new Error("Either eventId or query is required");
  }
  
  let queryVector: number[];
  
  // Get query vector from event or generate from text query
  if (eventId) {
    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const embeddingField = `${embedType}Embedding`;
    queryVector = event[embeddingField as keyof typeof event] as number[];
    
    if (!queryVector || queryVector.length === 0) {
      throw new Error(`Event does not have ${embedType} embedding`);
    }
  } else if (query) {
    queryVector = await getTextEmbedding(query);
  } else {
    throw new Error("Invalid search parameters");
  }
  
  // Execute vector search
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("communityevents");
    
    // Build filters
    const filter: any = { visibility: "public" };
    if (eventType) filter.eventType = eventType;
    if (tags && tags.length > 0) filter.tags = { $in: tags };
    if (culturalTags && culturalTags.length > 0) filter.culturalTags = { $in: culturalTags };
    
    // Filter for upcoming events if requested
    if (upcoming) {
      filter.date = { $gte: new Date() };
    }
    
    // Determine the embedding field to search
    const embedField = `${embedType}Embedding`;
    
    // Build aggregation pipeline with vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "bengaliEventVectorIndex",
          path: embedField,
          queryVector: queryVector,
          numCandidates: limit * 3,
          limit: limit,
          filter: filter
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          eventType: 1,
          date: 1,
          endDate: 1,
          location: 1,
          tags: 1,
          culturalTags: 1,
          aiSummary: 1,
          culturalSignificance: 1,
          organizerId: 1,
          coverImage: 1,
          status: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $match: {
          score: { $gte: minScore }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "organizerId",
          foreignField: "_id",
          as: "organizer"
        }
      },
      {
        $unwind: {
          path: "$organizer",
          preserveNullAndEmptyArrays: true
        }
      }
    ];
    
    const cursor = collection.aggregate(pipeline);
    const results = await cursor.toArray();
    
    return {
      events: results,
      count: results.length
    };
  } catch (error) {
    console.error("Error finding similar events:", error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Find similar media items based on vector embedding
 */
export async function findSimilarMedia(options: {
  mediaId?: string;
  query?: string;
  imageUrl?: string;
  embedType?: 'visual' | 'text' | 'multimodal' | 'cultural';
  mediaType?: 'photo' | 'video';
  tags?: string[];
  limit?: number;
  minScore?: number;
}) {
  const {
    mediaId,
    query,
    imageUrl,
    embedType = 'multimodal',
    mediaType,
    tags,
    limit = 10,
    minScore = 0.7
  } = options;
  
  if (!mediaId && !query && !imageUrl) {
    throw new Error("Either mediaId, query, or imageUrl is required");
  }
  
  let queryVector: number[];
  
  // Get query vector from media item, generate from text query, or from image URL
  if (mediaId) {
    const media = await MediaItem.findById(mediaId);
    if (!media) {
      throw new Error("Media item not found");
    }
    
    const embeddingField = `${embedType}Embedding`;
    queryVector = media[embeddingField as keyof typeof media] as number[];
    
    if (!queryVector || queryVector.length === 0) {
      throw new Error(`Media does not have ${embedType} embedding`);
    }
  } else if (query) {
    queryVector = await getTextEmbedding(query);
  } else if (imageUrl) {
    // Use multimodal embedding for image URL
    queryVector = await getMultimodalEmbedding(imageUrl, '');
  } else {
    throw new Error("Invalid search parameters");
  }
  
  // Execute vector search
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("mediaitems");
    
    // Build filters
    const filter: any = {};
    if (mediaType) filter.type = mediaType;
    if (tags && tags.length > 0) filter.tags = { $in: tags };
    
    // Determine the embedding field to search
    const embedField = `${embedType}Embedding`;
    
    // Build aggregation pipeline with vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "bengaliMediaVectorIndex",
          path: embedField,
          queryVector: queryVector,
          numCandidates: limit * 3,
          limit: limit,
          filter: filter
        }
      },
      {
        $project: {
          _id: 1,
          uri: 1,
          type: 1,
          title: 1,
          description: 1,
          tags: 1,
          geminiStory: 1,
          culturalContext: 1,
          userId: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $match: {
          score: { $gte: minScore }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      }
    ];
    
    const cursor = collection.aggregate(pipeline);
    const results = await cursor.toArray();
    
    return {
      mediaItems: results,
      count: results.length
    };
  } catch (error) {
    console.error("Error finding similar media:", error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Interface for content items with vector search score
 */
interface ScoredContentItem {
  _id: any;
  contentType: string;
  score: number;
  [key: string]: any;
}

/**
 * Find culturally relevant Bengali content across different content types
 * This is specialized for finding cultural connections
 */
export async function findCulturalContent(options: {
  query: string;
  culturalTheme?: string;
  includeEvents?: boolean;
  includePosts?: boolean;
  includeMedia?: boolean;
  limit?: number;
}) {
  const {
    query,
    culturalTheme,
    includeEvents = true,
    includePosts = true,
    includeMedia = true,
    limit = 15
  } = options;

  const queryVector = await getTextEmbedding(query);
  const results: { culturalContent: ScoredContentItem[], count: number } = { culturalContent: [], count: 0 };
  
  try {
    // Determine per-type limits
    const typeLimit = Math.ceil(limit / (
      (includeEvents ? 1 : 0) + 
      (includePosts ? 1 : 0) + 
      (includeMedia ? 1 : 0) || 1
    ));
    
    // Parallel fetch all relevant content
    const promises: Promise<ScoredContentItem[]>[] = [];
    
    if (includePosts) {
      promises.push(
        findSimilarPosts({
          query,
          embedType: 'cultural',
          tags: culturalTheme ? [culturalTheme] : undefined,
          limit: typeLimit,
          minScore: 0.6
        }).then(postResults => {
          return postResults.posts.map(post => ({
            ...post,
            contentType: 'post',
            score: post.score || 0
          } as ScoredContentItem));
        })
      );
    }
    
    if (includeEvents) {
      promises.push(
        findSimilarEvents({
          query,
          embedType: 'cultural',
          culturalTags: culturalTheme ? [culturalTheme] : undefined,
          limit: typeLimit,
          minScore: 0.6
        }).then(eventResults => {
          return eventResults.events.map(event => ({
            ...event,
            contentType: 'event',
            score: event.score || 0
          } as ScoredContentItem));
        })
      );
    }
    
    if (includeMedia) {
      promises.push(
        findSimilarMedia({
          query,
          embedType: 'cultural',
          tags: culturalTheme ? [culturalTheme] : undefined,
          limit: typeLimit,
          minScore: 0.6
        }).then(mediaResults => {
          return mediaResults.mediaItems.map(media => ({
            ...media,
            contentType: 'media',
            score: media.score || 0
          } as ScoredContentItem));
        })
      );
    }
    
    // Combine all results
    const allResults = await Promise.all(promises);
    const flatResults: ScoredContentItem[] = allResults.flat();
    
    // Sort by score and limit total
    results.culturalContent = flatResults
      .sort((a, b) => (b.score) - (a.score))
      .slice(0, limit);
    results.count = results.culturalContent.length;
    
    return results;
  } catch (error) {
    console.error("Error finding cultural content:", error);
    throw error;
  }
}

/**
 * Find similar cultural events for Bengali celebrations
 */
export async function findBengaliCulturalEvents(options: {
  culturalFestival?: string;
  location?: string;
  upcoming?: boolean;
  limit?: number;
}) {
  const { 
    culturalFestival,
    location,
    upcoming = true,
    limit = 10
  } = options;
  
  if (!culturalFestival && !location) {
    throw new Error("Either culturalFestival or location is required");
  }
  
  let queryText = '';
  if (culturalFestival) {
    queryText += `${culturalFestival} festival celebration bengali culture `;
  }
  if (location) {
    queryText += `${location} bengali event `;
  }
  
  queryText = queryText.trim();
  
  return findSimilarEvents({
    query: queryText,
    embedType: 'cultural',
    eventType: 'cultural',
    upcoming,
    limit
  });
}
