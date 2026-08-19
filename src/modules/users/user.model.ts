import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IDeliveryDetails {
  name: string;
  phone: string;
  address: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'vendor' | 'admin' | 'buyer';
  status: 'active' | 'inactive' | 'suspended';
  refreshToken?: string;
  delivery: IDeliveryDetails;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name cannot be empty'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name cannot be empty'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    userType: {
      type: String,
      enum: ['vendor', 'admin', 'buyer'],
      default: 'vendor',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    delivery: {
      name: {
        type: String,
        trim: true,
        default: '',
        maxlength: [100, 'Delivery name cannot exceed 100 characters'],
      },
      phone: {
        type: String,
        trim: true,
        default: '',
        maxlength: [20, 'Mobile number cannot exceed 20 characters'],
      },
      address: {
        type: String,
        trim: true,
        default: '',
        maxlength: [500, 'Delivery address cannot exceed 500 characters'],
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
