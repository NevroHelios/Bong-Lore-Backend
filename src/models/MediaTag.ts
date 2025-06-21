import { Schema, model, Document, Types } from 'mongoose';

export interface IMediaTag extends Document {
  mediaId: Types.ObjectId;
  tagId: Types.ObjectId;
  mediaType: 'photo' | 'video';
  confidence?: number;  // For AI-generated tags (confidence score)
  addedBy: Types.ObjectId | 'system' | 'ai';
  position?: {  // Optional: position in the media where the tag applies
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  timestamp?: number;  // For video: when the tag appears
  createdAt: Date;
  updatedAt: Date;
}

const mediaTagSchema = new Schema<IMediaTag>({
  mediaId: { 
    type: Schema.Types.ObjectId, 
    ref: 'MediaItem', 
    required: true, 
    index: true 
  },
  tagId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tag', 
    required: true, 
    index: true 
  },
  mediaType: { 
    type: String, 
    enum: ['photo', 'video'], 
    required: true, 
    index: true 
  },
  confidence: { 
    type: Number,
    min: 0,
    max: 1 
  },
  addedBy: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  position: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  timestamp: { 
    type: Number  // For video tags: timestamp in milliseconds
  }
}, { timestamps: true });

// Create compound indexes for efficient queries
mediaTagSchema.index({ mediaId: 1, tagId: 1 }, { unique: true });
mediaTagSchema.index({ tagId: 1, confidence: -1 });

export default model<IMediaTag>('MediaTag', mediaTagSchema);
