import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface IDeliveryDetails {
  name: string;
  phone: string;
  address: string;
}

export interface IPaymentDetails {
  paymentId: string;
  method: string;
  cardNo: string;
  cardHolderName: string;
  cardExpiry: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  customOrderId: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: IDeliveryDetails;
  payment?: IPaymentDetails;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, default: undefined },
    selectedColor: { type: String, default: undefined },
  },
  { _id: false },
);

const deliverySchema = new Schema<IDeliveryDetails>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const paymentSchema = new Schema<IPaymentDetails>(
  {
    paymentId: { type: String, required: true },
    method: { type: String, required: true },
    cardNo: { type: String, required: true },
    cardHolderName: { type: String, required: true },
    cardExpiry: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    customOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (arr: IOrderItem[]) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    delivery: {
      type: deliverySchema,
      required: [true, 'Delivery details are required'],
    },
    payment: {
      type: paymentSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

orderSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
