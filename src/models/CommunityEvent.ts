import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunityEvent extends Document {
  _id: Types.ObjectId;
  organizerId: Types.ObjectId;
  name: string;
  description?: string;
  eventType: 'cultural' | 'social' | 'educational' | 'religious' | 'festival' | 'workshop' | 'celebration' | 'other';
  
  // Event details
  date: Date;
  endDate?: Date;
  location: {
    name: string;
    address?: string;
    link?: string;
  };
  
  // Media and content
  mediaItems: Types.ObjectId[]; // References to MediaItem documents
  coverImage?: string; // Cloudinary URL for event cover
  posts: Types.ObjectId[]; // References to associated Post documents
  
  // Participation
  participants: Types.ObjectId[]; // User IDs who participated
  maxParticipants?: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  
  // Event status
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility: 'public' | 'community' | 'private';
  
  // Categorization
  tags: string[];
  culturalTags: string[]; // Specific cultural significance tags
  
  // Summary and analysis
  aiSummary?: {
    summary: string;
    highlights: string[];
    participation: {
      level: 'low' | 'moderate' | 'high';
      diversity: 'limited' | 'good' | 'excellent';
      engagement: 'passive' | 'active' | 'highly-engaged';
      totalParticipants: number;
    };
    impact: string;
    generatedAt: Date;
  };
  
  // Cultural significance
  culturalSignificance?: {
    importance: 'low' | 'medium' | 'high' | 'critical';
    heritage: string;
    traditions: string[];
    communityValue: string;
  };
  
  // Organizer notes and feedback
  organizerNotes?: string;
  feedback: {
    userId: Types.ObjectId;
    rating: number; // 1-5
    comment?: string;
    timestamp: Date;
  }[];
  
  // Social engagement
  likes: Types.ObjectId[];
  shares: number;
  views: number;
  
  // Vector embeddings for similarity search
  textEmbedding?: number[];
  culturalEmbedding?: number[];
  
  // Add collections field to reference collections created for this event
  collections: Types.ObjectId[]; // References to Collection documents
  
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  link : { type: String }, // Optional link to a map or location
}, { _id: false });

const participationSchema = new Schema({
  level: { 
    type: String, 
    enum: ['low', 'moderate', 'high'], 
    default: 'moderate' 
  },
  diversity: { 
    type: String, 
    enum: ['limited', 'good', 'excellent'], 
    default: 'good' 
  },
  engagement: { 
    type: String, 
    enum: ['passive', 'active', 'highly-engaged'], 
    default: 'active' 
  },
  totalParticipants: { type: Number, default: 0 }
}, { _id: false });

const aiSummarySchema = new Schema({
  summary: { type: String, required: true },
  highlights: [{ type: String }],
  participation: participationSchema,
  impact: { type: String },
  generatedAt: { type: Date, default: Date.now }
}, { _id: false });

const culturalSignificanceSchema = new Schema({
  importance: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  heritage: { type: String },
  traditions: [{ type: String }],
  communityValue: { type: String }
}, { _id: false });

const feedbackSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const communityEventSchema = new Schema<ICommunityEvent>({
  organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  eventType: { 
    type: String, 
    enum: ['cultural', 'social', 'educational', 'religious', 'festival', 'workshop', 'celebration', 'other'],
    required: true,
    index: true
  },
  
  // Event timing
  date: { type: Date, required: true, index: true },
  endDate: { type: Date },
  location: { type: locationSchema, required: true },
  
  // Media
  mediaItems: [{ type: Schema.Types.ObjectId, ref: 'MediaItem' }],
  coverImage: { type: Buffer }, // Cloudinary URL
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  
  // Participation
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  maxParticipants: { type: Number },
  registrationRequired: { type: Boolean, default: false },
  registrationDeadline: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  visibility: { 
    type: String, 
    enum: ['public', 'community', 'private'],
    default: 'public',
    index: true
  },
  
  // Categorization
  tags: [{ type: String, index: true }],
  culturalTags: [{ type: String, index: true }],
  
  // AI Analysis
  aiSummary: aiSummarySchema,
  culturalSignificance: culturalSignificanceSchema,
  
  // Additional fields
  organizerNotes: { type: String, maxlength: 1000 },
  feedback: [feedbackSchema],
  
  // Social metrics
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  shares: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  
  // Vector embeddings
  textEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
  culturalEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  },
  
  // Collections related to this event
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
}, { 
  timestamps: true
});

// Define compound indexes after schema creation
communityEventSchema.index({ organizerId: 1, createdAt: -1 });
communityEventSchema.index({ date: 1, status: 1 });
communityEventSchema.index({ eventType: 1, visibility: 1 });
communityEventSchema.index({ 'locationName': 1 });
communityEventSchema.index({ status: 1, date: 1 });

// Text search index
communityEventSchema.index({
  name: 'text',
  description: 'text',
  'aiSummary.summary': 'text',
  tags: 'text',
  culturalTags: 'text'
});

// Compound index for location-based queries
communityEventSchema.index({
  'location.latitude': 1,
  'location.longitude': 1,
  date: 1
});

export default model<ICommunityEvent>('CommunityEvent', communityEventSchema);
