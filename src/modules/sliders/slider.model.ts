import mongoose, { Schema, Document } from 'mongoose';

export interface ISlider extends Document {
  imageUrl: string;
  imageKey: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sliderSchema = new Schema<ISlider>(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    imageKey: {
      type: String,
      required: [true, 'Image key is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Slider = mongoose.model<ISlider>('Slider', sliderSchema);
