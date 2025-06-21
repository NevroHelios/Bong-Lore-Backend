import { Schema, model, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  description?: string;
  category?: string;
  createdBy?: Schema.Types.ObjectId;
  isSystemGenerated: boolean;
  useCount: number;
  vectorEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    index: true 
  },
  description: { 
    type: String 
  },
  category: { 
    type: String,
    index: true 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isSystemGenerated: { 
    type: Boolean, 
    default: false 
  },
  useCount: { 
    type: Number, 
    default: 0 
  },
  vectorEmbedding: {
    type: [Number],
    default: undefined,
    index: false
  }
}, { timestamps: true });

// Create text index for search
tagSchema.index({ name: 'text', description: 'text' });

export default model<ITag>('Tag', tagSchema);
