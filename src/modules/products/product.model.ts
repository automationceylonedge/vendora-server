import mongoose, { Schema, Document } from 'mongoose';

export interface IProductImage {
  url: string;
  key: string;
  isMain: boolean;
}

export interface IProductColor {
  hex: string;
  name: string;
}

export interface IProduct extends Document {
  vendor: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number;
  images: IProductImage[];
  colors: IProductColor[];
  sizes: string[];
  inventory: Map<string, Map<string, number>>; // colorKey → sizeKey → qty
  status: 'active' | 'inactive' | 'draft';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    isMain: { type: Boolean, default: false },
  },
  { _id: false },
);

const productColorSchema = new Schema<IProductColor>(
  {
    hex: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: (arr: IProductImage[]) => arr.length <= 5,
        message: 'Cannot have more than 5 images',
      },
    },
    colors: {
      type: [productColorSchema],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    inventory: {
      type: Map,
      of: Map,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'electronics',
        'fashion_apparel',
        'beauty_personal_care',
        'home_kitchen',
        'groceries_food',
        'health_wellness',
        'sports_outdoor',
        'automotive',
        'books_stationery',
        'toys_games',
        'baby_kids',
        'pet_supplies',
        'furniture',
        'jewelry_watches',
        'mobile_phones_accessories',
        'computers_accessories',
        'home_appliances',
        'office_supplies',
        'arts_crafts_hobbies',
        'tools_hardware',
      ],
    },
  },
  { timestamps: true },
);

productSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
