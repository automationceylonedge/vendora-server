import { z } from 'zod';

export const updateDeliverySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().min(7, 'Mobile number is required').max(20),
  address: z.string().trim().min(1, 'Address is required').max(500),
});

export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;

export const updateBusinessSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(120).optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
