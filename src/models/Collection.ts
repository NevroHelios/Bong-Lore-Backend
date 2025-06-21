import { Schema, model, Document, Types } from 'mongoose';

/**
 * Interface representing a Collection (similar to subreddit)
 * for organizing media content by topic or community
 */
export interface ICollection extends Document {
  name: string;
  slug: string; // URL-friendly name
  description?: string;
  coverImage?: string;
  icon?: string;
  isPrivate: boolean;
  createdBy: Types.ObjectId;
  moderators: Types.ObjectId[];
  members: Types.ObjectId[];
  memberCount: number;
  relatedTags: Types.ObjectId[];
  mediaItems: Types.ObjectId[]; // References to media items in this collection
  featured: boolean; // Whether this collection is featured on the homepage
  createdAt: Date;
  updatedAt: Date;

  // New field to link to community events
  eventId?: Types.ObjectId; // Optional reference to a community event
}

/**
 * Schema for a Collection (similar to subreddit) to organize media by topic/community
 */
const collectionSchema = new Schema<ICollection>({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    index: true 
  },
  description: { 
    type: String 
  },
  coverImage: { 
    type: String 
  },
  icon: { 
    type: String 
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  moderators: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  members: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  memberCount: { 
    type: Number, 
    default: 0 
  },
  relatedTags: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Tag' 
  }],
  mediaItems: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'MediaItem' 
  }],
  featured: {
    type: Boolean,
    default: false
  },

  // Link to community event
  eventId: { type: Schema.Types.ObjectId, ref: 'CommunityEvent', index: true },
}, { timestamps: true });

// Create text index for search
collectionSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate the slug from name if not provided
collectionSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  next();
});

// Add index for event-based queries
collectionSchema.index({ eventId: 1, isPrivate: 1 });

export default model<ICollection>('Collection', collectionSchema);
