import { Schema, model, Document, Types } from 'mongoose';

export enum TagRelationType {
  RELATED = 'related',      // General relationship
  SYNONYM = 'synonym',      // Same meaning
  PARENT_CHILD = 'parent-child', // Hierarchical relationship
  OPPOSITE = 'opposite'     // Opposite meaning
}

export interface ITagRelation extends Document {
  sourceTagId: Types.ObjectId;
  targetTagId: Types.ObjectId;
  relationType: TagRelationType;
  strength: number;  // Relationship strength (0-1)
  createdBy: Types.ObjectId | 'system' | 'ai';
  createdAt: Date;
  updatedAt: Date;
}

const tagRelationSchema = new Schema<ITagRelation>({
  sourceTagId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tag', 
    required: true, 
    index: true 
  },
  targetTagId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Tag', 
    required: true, 
    index: true 
  },
  relationType: { 
    type: String, 
    enum: Object.values(TagRelationType),
    required: true 
  },
  strength: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1,
    default: 1
  },
  createdBy: { 
    type: Schema.Types.Mixed, 
    required: true 
  }
}, { timestamps: true });

// Create compound index for efficient queries and to ensure uniqueness
tagRelationSchema.index({ sourceTagId: 1, targetTagId: 1, relationType: 1 }, { unique: true });

export default model<ITagRelation>('TagRelation', tagRelationSchema);
