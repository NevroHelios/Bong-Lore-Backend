import { Schema, model, Document, Types } from 'mongoose';

export interface IComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  text: string;
  timestamp: number;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface IMediaItem extends Document {
  userId: Types.ObjectId;
  uri: string;
  type: 'photo' | 'video';
  timestamp: number;
  aspectRatio?: number;
  title?: string;
  description?: string;
  likes: Types.ObjectId[];
  comments: IComment[];
  geminiStory?: Record<string, string>;
  location?: ILocation;
  tags?: string[];
  collections?: Types.ObjectId[]; // Reference to collections this media belongs to
  featured: boolean; // Whether this item is featured
  
  // AI Summary fields
  aiSummary?: {
    summary: string;
    hashtags: string[];
    mood: string;
    themes: string[];
    generatedAt: Date;
    summaryType: 'media' | 'cultural' | 'creative' | 'travel';
  };
  
  // Cultural heritage context
  culturalContext?: {
    significance: string;
    historicalContext: string;
    preservation: string;
    period?: string;
  };
  
  // Creative content context
  creativeContext?: {
    narrative: string;
    artisticElements: string[];
    genre?: string;
    inspiration?: string;
  };
  
  // Travel/location context
  travelContext?: {
    attractions: string[];
    recommendations: string[];
    travelTips: string[];
    season?: string;
    travelStyle?: string;
  };
  
  // Vector embeddings for similarity search
  visualEmbedding?: number[];
  textEmbedding?: number[];
  multimodalEmbedding?: number[];
  culturalEmbedding?: number[];
}

const commentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, required: true },
}, { _id: true });

const locationSchema = new Schema<ILocation>({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  name: { type: String },
}, { _id: false });

// AI Summary schema
const aiSummarySchema = new Schema({
  summary: { type: String, required: true },
  hashtags: [{ type: String }],
  mood: { type: String, default: 'neutral' },
  themes: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
  summaryType: { 
    type: String, 
    enum: ['media', 'cultural', 'creative', 'travel'], 
    default: 'media' 
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

const mediaItemSchema = new Schema<IMediaItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  uri: { type: String, required: true },
  type: { type: String, enum: ['photo', 'video'], required: true, index: true },
  aspectRatio: { type: Number },
  title: { type: String },
  description: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  comments: [commentSchema],
  geminiStory: { type: Schema.Types.Mixed },
  location: locationSchema,
  tags: [{ type: String, index: true }], // Legacy tags field - keeping for backward compatibility
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection', index: true }],
  featured: { type: Boolean, default: false, index: true },
  
  // AI Summary fields
  aiSummary: aiSummarySchema,
  culturalContext: culturalContextSchema,
  creativeContext: creativeContextSchema,
  travelContext: travelContextSchema,
  
  // Vector embeddings
  visualEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
  textEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
  multimodalEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
  culturalEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
}, { timestamps: true });

export default model<IMediaItem>('MediaItem', mediaItemSchema);
