import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  name?: string;
  email: string;
  password?: string;
  profilePicture?: string;
  lastLogin?: Date;
  lastLogout?: Date;
  score: number;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { 
    type: String, 
    unique: true,
    sparse: true, // Allows multiple documents to have a null value for googleId
  },
  name: { 
    type: String, 
    required: false, // Name is not strictly required at signup
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
  },
  password: {
    type: String,
    required: false, // Not required for users who signed up with Google
  },
  profilePicture: { 
    type: String, 
    required: false 
  },
  lastLogin: { 
    type: Date,
    default: Date.now,
  },
  lastLogout: {
    type: Date,
  },
  score: { type: Number, default: 0 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, {
  timestamps: true,
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
