import mongoose from 'mongoose';
import { Order } from './order.model';
import { ApiError } from '../../shared/utils/api-error';
import type { CreateOrderInput } from './order.validation';

export const SHIPPING_FEE = 450;
export const FREE_SHIPPING_THRESHOLD = 10000;

export async function createOrder(userId: string, input: CreateOrderInput) {
  const items = input.items.map((item) => ({
    productId: new mongoose.Types.ObjectId(item.productId),
    price: item.price,
    quantity: item.quantity,
    selectedSize: item.selectedSize ?? undefined,
    selectedColor: item.selectedColor ?? undefined,
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const order = await Order.create({
    user: userId,
    items,
    subtotal,
    shipping,
    total,
    delivery: input.delivery,
    status: 'pending',
  });

  return order.toJSON();
}

export async function getMyOrders(userId: string) {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  return orders;
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
}
