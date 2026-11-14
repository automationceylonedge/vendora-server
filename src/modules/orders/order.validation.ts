import { z } from 'zod';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID');

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        price: z.number().min(0, 'Price cannot be negative'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        selectedSize: z.string().max(50).nullable().optional(),
        selectedColor: z.string().max(100).nullable().optional(),
      }),
    )
    .min(1, 'Order must contain at least one item'),
  delivery: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    phone: z.string().trim().min(7, 'Mobile number is required').max(20),
    address: z.string().trim().min(1, 'Address is required').max(500),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Vendors can only move an order forward to delivered / completed.
export const updateOrderStatusSchema = z.object({
  status: z.enum(['delivered', 'completed'], {
    message: 'Status must be delivered or completed',
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
