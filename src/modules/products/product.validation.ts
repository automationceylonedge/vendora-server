import { z } from 'zod';

/* ── Category constants ── */

export const PRODUCT_CATEGORIES = [
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
] as const;

/* ── Helpers ── */

/**
 * Parse a JSON string field (from multipart form data) into an array,
 * silently falling back to an empty array on invalid input.
 */
function jsonArray<T>(schema: z.ZodType<T>) {
  return z.string().transform((val) => {
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item: unknown) => schema.safeParse(item).success);
    } catch {
      return [];
    }
  });
}

/**
 * Parse a JSON string field into a Record<string, unknown>,
 * silently falling back to an empty object on invalid input.
 */
function jsonRecord() {
  return z.string().transform((val) => {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed;
    } catch {
      return {};
    }
  });
}

/* ── Schemas ── */

const colorSchema = z.object({
  hex: z.string(),
  name: z.string(),
});

/* ── Create ── */

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).default(''),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  colors: jsonArray(colorSchema),
  sizes: jsonArray(z.string()),
  inventory: jsonRecord(),
  mainImageIndex: z.coerce.number().int().min(0).default(0),
  category: z.enum(PRODUCT_CATEGORIES, { message: 'Category is required' }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/* ── Update ── */

export const updateProductSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().min(0).optional(),
  colors: jsonArray(colorSchema).optional(),
  sizes: jsonArray(z.string()).optional(),
  inventory: jsonRecord().optional(),
  mainImageIndex: z.coerce.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  /** Array of R2 image keys to delete, sent as JSON string */
  deleteImageKeys: jsonArray(z.string()).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
