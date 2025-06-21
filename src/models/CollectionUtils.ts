import { Types } from 'mongoose';
import Collection from './Collection.js';
import { CollectionMember, CollectionMedia } from './CollectionRelations.js';
import MediaItem from './MediaItem.js';
import CommunityEvent from './CommunityEvent.js';

/**
 * Utility class for managing Collections (subreddit-like structures)
 */
export class CollectionUtils {
  /**
   * Create a new collection
   */
  static async createCollection(
    name: string,
    description: string,
    createdBy: Types.ObjectId,
    isPrivate = false,
    slug?: string,
    coverImage?: string,
    icon?: string
  ) {
    const collection = new Collection({
      name,
      slug: slug || undefined, // If not provided, will be auto-generated from name
      description,
      createdBy,
      isPrivate,
      coverImage,
      icon,
      moderators: [createdBy], // Creator is automatically a moderator
      members: [createdBy],    // Creator is automatically a member
      memberCount: 1
    });
    
    await collection.save();
    
    // Add creator as admin member
    await CollectionMember.create({
      collectionId: collection._id,
      userId: createdBy,
      role: 'admin',
      favorite: true
    });
    
    return collection;
  }
  
  /**
   * Create a new collection for an event
   */
  static async createEventCollection(
    eventId: Types.ObjectId,
    name: string,
    description: string,
    createdBy: Types.ObjectId,
    coverImage?: string,
    icon?: string
  ) {
    // Create the base collection
    const collection = await this.createCollection(
      name,
      description,
      createdBy,
      false, // Event collections are public by default
      undefined, // Auto-generate slug
      coverImage,
      icon
    );
    
    // Update with event ID
    await Collection.findByIdAndUpdate(collection._id, {
      eventId
    });
    
    // Update the event to include this collection
    await CommunityEvent.findByIdAndUpdate(eventId, {
      $addToSet: { collections: collection._id }
    });
    
    return collection;
  }
  
  /**
   * Add a media item to a collection
   */
  static async addMediaToCollection(
    collectionId: Types.ObjectId,
    mediaId: Types.ObjectId,
    addedBy: Types.ObjectId,
    featured = false
  ) {
    // Check if collection exists
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    // Check if media exists
    const media = await MediaItem.findById(mediaId);
    if (!media) {
      throw new Error('Media item not found');
    }
    
    // Create relation
    const collectionMedia = await CollectionMedia.create({
      collectionId,
      mediaId,
      addedBy,
      featured
    });
    
    // Update the media item to include this collection
    await MediaItem.findByIdAndUpdate(mediaId, {
      $addToSet: { collections: collectionId },
      featured: featured ? true : media.featured // If featured here, mark as featured
    });
    
    // Update the collection
    await Collection.findByIdAndUpdate(collectionId, {
      $addToSet: { mediaItems: mediaId }
    });
    
    return collectionMedia;
  }
  
  /**
   * Remove a media item from a collection
   */
  static async removeMediaFromCollection(
    collectionId: Types.ObjectId,
    mediaId: Types.ObjectId
  ) {
    // Delete the relation
    await CollectionMedia.findOneAndDelete({
      collectionId,
      mediaId
    });
    
    // Update the media item
    await MediaItem.findByIdAndUpdate(mediaId, {
      $pull: { collections: collectionId }
    });
    
    // Update the collection
    await Collection.findByIdAndUpdate(collectionId, {
      $pull: { mediaItems: mediaId }
    });
    
    return true;
  }
  
  /**
   * Add a member to a collection
   */
  static async addMemberToCollection(
    collectionId: Types.ObjectId,
    userId: Types.ObjectId,
    role: 'member' | 'moderator' | 'admin' = 'member'
  ) {
    // Check if collection exists
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    // Create member relation if it doesn't exist
    const member = await CollectionMember.findOneAndUpdate(
      { collectionId, userId },
      { role },
      { upsert: true, new: true }
    );
    
    // Update the collection
    await Collection.findByIdAndUpdate(collectionId, {
      $addToSet: { members: userId },
      $inc: { memberCount: 1 }
    });
    
    return member;
  }
  
  /**
   * Remove a member from a collection
   */
  static async removeMemberFromCollection(
    collectionId: Types.ObjectId,
    userId: Types.ObjectId
  ) {
    // Delete the member relation
    await CollectionMember.findOneAndDelete({
      collectionId,
      userId
    });
    
    // Update the collection
    await Collection.findByIdAndUpdate(collectionId, {
      $pull: { members: userId, moderators: userId },
      $inc: { memberCount: -1 }
    });
    
    return true;
  }
  
  /**
   * Get all collections a user is a member of
   */
  static async getUserCollections(userId: Types.ObjectId) {
    const memberships = await CollectionMember.find({ userId });
    const collectionIds = memberships.map((m: any) => m.collectionId);
    
    return Collection.find({ _id: { $in: collectionIds } });
  }
  
  /**
   * Get all media in a collection
   */
  static async getCollectionMedia(collectionId: Types.ObjectId, limit = 20, skip = 0) {
    const mediaRelations = await CollectionMedia.find({ collectionId })
      .sort({ featured: -1, addedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const mediaIds = mediaRelations.map((rel: any) => rel.mediaId);
    return MediaItem.find({ _id: { $in: mediaIds } });
  }
  
  /**
   * Search for collections by name or description
   */
  static async searchCollections(query: string, limit = 10) {
    return Collection.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
  }
}

export default CollectionUtils;
