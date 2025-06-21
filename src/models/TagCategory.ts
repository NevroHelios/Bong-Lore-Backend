import { Schema, model, Document, Types } from 'mongoose';

export interface ITagCategory extends Document {
  name: string;
  description?: string;
  parentCategory?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  isSystemCategory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tagCategorySchema = new Schema<ITagCategory>({
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
  parentCategory: { 
    type: Schema.Types.ObjectId, 
    ref: 'TagCategory' 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isSystemCategory: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Create text index for search
tagCategorySchema.index({ name: 'text', description: 'text' });

export default model<ITagCategory>('TagCategory', tagCategorySchema);
