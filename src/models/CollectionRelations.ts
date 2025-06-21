import { Schema, model, Document, Types } from 'mongoose';

/**
 * Interface for tracking media items in collections and user relationships
 */
export interface ICollectionMember extends Document {
  collectionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'member' | 'moderator' | 'admin'; // Role in this collection
  joinedAt: Date;
  favorite: boolean; // Whether this collection is a favorite for the user
  notificationSettings: {
    newPosts: boolean;
    featuredPosts: boolean;
    announcements: boolean;
  };
}

/**
 * Interface for media items in collections (for easy lookup)
 */
export interface ICollectionMedia extends Document {
  collectionId: Types.ObjectId;
  mediaId: Types.ObjectId;
  addedBy: Types.ObjectId;
  featured: boolean;
  addedAt: Date;
}

/**
 * Schema for tracking collection memberships
 */
const collectionMemberSchema = new Schema<ICollectionMember>({
  collectionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Collection', 
    required: true,
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  role: { 
    type: String, 
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  favorite: {
    type: Boolean,
    default: false
  },
  notificationSettings: {
    newPosts: { type: Boolean, default: true },
    featuredPosts: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  }
});

// Create a compound index for userId and collectionId combination
collectionMemberSchema.index({ userId: 1, collectionId: 1 }, { unique: true });

/**
 * Schema for tracking media items in collections
 */
const collectionMediaSchema = new Schema<ICollectionMedia>({
  collectionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Collection', 
    required: true,
    index: true
  },
  mediaId: { 
    type: Schema.Types.ObjectId, 
    ref: 'MediaItem', 
    required: true,
    index: true
  },
  addedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  featured: {
    type: Boolean,
    default: false
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create a compound index for mediaId and collectionId combination
collectionMediaSchema.index({ mediaId: 1, collectionId: 1 }, { unique: true });

export const CollectionMember = model<ICollectionMember>('CollectionMember', collectionMemberSchema);
export const CollectionMedia = model<ICollectionMedia>('CollectionMedia', collectionMediaSchema);
