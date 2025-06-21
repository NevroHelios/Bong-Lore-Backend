import { Types } from 'mongoose';
import Tag from './Tag.js';
import MediaTag from './MediaTag.js';
import TagCategory from './TagCategory.js';
import TagRelation from './TagRelation.js';

/**
 * Create a new tag or update an existing one
 */
export const createOrUpdateTag = async (
  name: string, 
  options: {
    description?: string;
    category?: string;
    createdBy?: Types.ObjectId;
    isSystemGenerated?: boolean;
  } = {}
) => {
  const tagData = {
    name: name.toLowerCase().trim(),
    ...(options.description && { description: options.description }),
    ...(options.category && { category: options.category }),
    ...(options.createdBy && { createdBy: options.createdBy }),
    ...(options.isSystemGenerated !== undefined && { isSystemGenerated: options.isSystemGenerated })
  };

  // Use findOneAndUpdate with upsert to create if doesn't exist or update if it does
  const tag = await Tag.findOneAndUpdate(
    { name: tagData.name },
    { $setOnInsert: tagData },
    { upsert: true, new: true }
  );

  return tag;
};

/**
 * Add tags to a media item
 */
export const addTagsToMedia = async (
  mediaId: Types.ObjectId,
  mediaType: 'photo' | 'video',
  tags: Array<{
    name: string;
    confidence?: number;
    addedBy: Types.ObjectId | 'system' | 'ai';
    position?: { x?: number; y?: number; width?: number; height?: number };
    timestamp?: number;
  }>
) => {
  const results = [];
  
  for (const tagData of tags) {
    // Create or get the tag
    const tag = await createOrUpdateTag(tagData.name);
    
    // Create the media-tag relationship
    const mediaTag = await MediaTag.findOneAndUpdate(
      { mediaId, tagId: tag._id },
      {
        mediaType,
        ...(tagData.confidence !== undefined && { confidence: tagData.confidence }),
        addedBy: tagData.addedBy,
        ...(tagData.position && { position: tagData.position }),
        ...(tagData.timestamp !== undefined && { timestamp: tagData.timestamp })
      },
      { upsert: true, new: true }
    );

    // Increment the tag use count
    await Tag.updateOne(
      { _id: tag._id },
      { $inc: { useCount: 1 } }
    );
    
    results.push({
      tag,
      mediaTag
    });
  }
  
  return results;
};

/**
 * Get all tags for a media item
 */
export const getTagsForMedia = async (mediaId: Types.ObjectId) => {
  const mediaTags = await MediaTag.find({ mediaId })
    .populate('tagId')
    .sort({ confidence: -1 });
  
  return mediaTags;
};

/**
 * Search for tags
 */
export const searchTags = async (query: string, limit = 10) => {
  const tags = await Tag.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);
  
  return tags;
};

/**
 * Get popular tags
 */
export const getPopularTags = async (limit = 10, categoryId?: Types.ObjectId) => {
  const query = categoryId ? { category: categoryId } : {};
  
  const tags = await Tag.find(query)
    .sort({ useCount: -1 })
    .limit(limit);
  
  return tags;
};

/**
 * Get related tags
 */
export const getRelatedTags = async (tagId: Types.ObjectId, limit = 10) => {
  const relations = await TagRelation.find({ sourceTagId: tagId })
    .populate('targetTagId')
    .sort({ strength: -1 })
    .limit(limit);
  
  return relations.map(relation => ({
    tag: relation.targetTagId,
    relationType: relation.relationType,
    strength: relation.strength
  }));
};

/**
 * Create a tag category
 */
export const createTagCategory = async (
  name: string,
  options: {
    description?: string;
    parentCategory?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    isSystemCategory?: boolean;
  } = {}
) => {
  const category = await TagCategory.create({
    name,
    ...(options.description && { description: options.description }),
    ...(options.parentCategory && { parentCategory: options.parentCategory }),
    ...(options.createdBy && { createdBy: options.createdBy }),
    ...(options.isSystemCategory !== undefined && { isSystemCategory: options.isSystemCategory })
  });
  
  return category;
};
