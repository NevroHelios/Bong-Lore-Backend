import { Schema, model, Document, Types } from 'mongoose';

// Sub-schemas for embedding in the main Post document
const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const aiSummarySchema = new Schema({
  summary: { type: String, required: true },
  hashtags: [{ type: String }],
  mood: { type: String, default: 'neutral' },
  themes: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
  summaryType: { 
    type: String, 
    enum: ['post', 'cultural', 'creative', 'travel'], 
    default: 'post' 
  }
}, { _id: false });

const culturalContextSchema = new Schema({
  significance: { type: String },
  historicalContext: { type: String },
  preservation: { type: String },
  period: { type: String }
}, { _id: false });

const creativeContextSchema = new Schema({
  narrative: { type: String },
  artisticElements: [{ type: String }],
  genre: { type: String },
  inspiration: { type: String }
}, { _id: false });

const travelContextSchema = new Schema({
  attractions: [{ type: String }],
  recommendations: [{ type: String }],
  travelTips: [{ type: String }],
  season: { type: String },
  travelStyle: { type: String }
}, { _id: false });

// Main Post Interface
export interface IPost extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title?: string;
  description?: string;
  mediaItems: Types.ObjectId[];
  tags: string[];
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  likes: Types.ObjectId[];
  comments: any[]; // Define more specific type if needed
  collections: Types.ObjectId[];
  featured: boolean;
  visibility: 'public' | 'private' | 'community';
  aiSummary?: any;
  culturalContext?: any;
  creativeContext?: any;
  travelContext?: any;
  textEmbedding?: number[];
  multimodalEmbedding?: number[];
  culturalEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Main Post Schema
const postSchema = new Schema<IPost>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  description: { type: String },
  mediaItems: [{ type: Schema.Types.ObjectId, ref: 'MediaItem' }],
  tags: [{ type: String }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coordinates: number[]) {
          // Validate that coordinates are in bounds
          // [longitude, latitude] - longitude: -180 to 180, latitude: -90 to 90
          return coordinates.length === 2 && 
                 coordinates[0] >= -180 && coordinates[0] <= 180 && 
                 coordinates[1] >= -90 && coordinates[1] <= 90;
        },
        message: 'Invalid GeoJSON coordinates. Longitude must be between -180 and 180, Latitude must be between -90 and 90. Format: [longitude, latitude]'
      }
    }
  },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
  featured: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private', 'community'], default: 'public' },
  aiSummary: aiSummarySchema,
  culturalContext: culturalContextSchema,
  creativeContext: creativeContextSchema,
  travelContext: travelContextSchema,
  textEmbedding: [Number],
  multimodalEmbedding: [Number],
  culturalEmbedding: [Number]
}, { timestamps: true });

// --- CRITICAL GEOSPATIAL INDEX ---
postSchema.index({ location: '2dsphere' });

export default model<IPost>('Post', postSchema);
