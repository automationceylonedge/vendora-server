import mongoose from 'mongoose';
import { Order } from './order.model.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../shared/utils/api-error.js';
import {
  notifyBuyerOfStatusChange,
  notifyVendorsOfNewOrder,
} from './order-email.service.js';
import type { CreateOrderInput } from './order.validation.js';

export const SHIPPING_FEE = 450;
export const FREE_SHIPPING_THRESHOLD = 10000;

function generateCustomOrderId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VND${ts}${rand}`;
}

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
    customOrderId: generateCustomOrderId(),
    items,
    subtotal,
    shipping,
    total,
    delivery: input.delivery,
    status: 'pending',
  });

  // Fire-and-forget: email failures never block order placement.
  void notifyVendorsOfNewOrder(order);

  return order.toJSON();
}

export async function listOrders(userId: string, userType: string) {
  if (userType === 'buyer') {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.productId');
    return orders;
  }

  if (userType === 'admin') {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.productId');
    return orders;
  }

  // Vendor: only orders that contain at least one of the vendor's products.
  const vendorProductIds = await Product.find({ vendor: userId }).distinct('_id');
  const orders = await Order.find({
    'items.productId': { $in: vendorProductIds },
  })
    .sort({ createdAt: -1 })
    .populate('items.productId');

  // Keep only the line items that belong to this vendor.
  return orders.map((order) => {
    const doc = order.toObject();
    doc.items = doc.items.filter(
      (item: any) =>
        item.productId &&
        vendorProductIds.some(
          (id) => String(id) === String(item.productId._id ?? item.productId),
        ),
    );
    return doc;
  });
}

export async function getOrderById(
  orderId: string,
  userId: string,
  userType: string,
) {
  const order = await Order.findById(orderId).populate('items.productId');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (userType === 'buyer' && String(order.user) !== userId) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  if (userType === 'vendor') {
    const vendorProductIds = await Product.find({ vendor: userId }).distinct(
      '_id',
    );
    const hasVendorItem = (order.items as any[]).some(
      (item) =>
        item.productId &&
        vendorProductIds.some(
          (id) => String(id) === String(item.productId._id ?? item.productId),
        ),
    );
    if (!hasVendorItem) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    // Keep only this vendor's line items.
    const doc = order.toObject();
    doc.items = doc.items.filter(
      (item: any) =>
        item.productId &&
        vendorProductIds.some(
          (id) => String(id) === String(item.productId._id ?? item.productId),
        ),
    );
    return doc;
  }

  // admin — full access
  return order;
}

/**
 * Vendor-scoped status update. Only allows moving an order forward to
 * `delivered` or `completed`, and only when the order contains at least
 * one of the vendor's products.
 */
export async function updateOrderStatus(
  orderId: string,
  vendorId: string,
  status: 'delivered' | 'completed',
) {
  const order = await Order.findById(orderId).populate('items.productId');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const vendorProductIds = await Product.find({ vendor: vendorId }).distinct(
    '_id',
  );
  const hasVendorItem = (order.items as any[]).some(
    (item) =>
      item.productId &&
      vendorProductIds.some(
        (id) => String(id) === String(item.productId._id ?? item.productId),
      ),
  );
  if (!hasVendorItem) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  order.status = status;
  await order.save();

  void notifyBuyerOfStatusChange(order);

  return order;
}
