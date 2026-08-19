import { Product } from './product.model';
import { uploadFile, deleteFile } from '../../shared/utils/r2';
import type { CreateProductInput, UpdateProductInput } from './product.validation';
import { ApiError } from '../../shared/utils/api-error';

/* ── Helpers ── */

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

/** Turn a title into a URL-safe slug, then ensure it's unique in the DB. */
async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars (except spaces/hyphens)
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens

  // Check if slug exists, append -N if it does
  const existing = await Product.findOne({ slug: base }).select('_id');
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const candidate = `${base}-${counter}`;
    const found = await Product.findOne({ slug: candidate }).select('_id');
    if (!found) return candidate;
    counter++;
  }
}

/* ── Service ── */

export async function createProduct(
  vendorId: string,
  input: CreateProductInput,
  files: Express.Multer.File[],
) {
  const images = await Promise.all(
    files.map(async (file, index) => {
      const fileName = generateFileName(file.originalname);
      const { url, key } = await uploadFile({
        buffer: file.buffer,
        fileName,
        mimeType: file.mimetype,
        folder: 'Product Images',
      });
      return { url, key, isMain: index === input.mainImageIndex };
    }),
  );

  const slug = await generateUniqueSlug(input.title);

  const product = await Product.create({
    vendor: vendorId,
    title: input.title,
    slug,
    description: input.description,
    price: input.price,
    images,
    colors: input.colors,
    sizes: input.sizes,
    inventory: input.inventory,
    category: input.category,
  });

  return product.toJSON();
}

export async function getVendorProducts(
  vendorId: string,
  search?: string,
  minPrice?: number,
  maxPrice?: number,
  category?: string,
) {
  const filter: Record<string, unknown> = { vendor: vendorId };

  if (search && search.trim()) {
    filter.title = { $regex: search.trim(), $options: 'i' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, unknown> = {};
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
    filter.price = priceFilter;
  }

  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter)
    .sort({ createdAt: -1 });
  return products;
}

export async function getProductById(productId: string) {
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
}

export async function updateProduct(
  productId: string,
  vendorId: string,
  input: UpdateProductInput,
  files?: Express.Multer.File[],
) {
  const product = await Product.findOne({ _id: productId, vendor: vendorId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Upload new images if provided
  if (files && files.length > 0) {
    const existingCount = product.images.length;
    const remaining = 5 - existingCount;
    const toUpload = files.slice(0, remaining);

    const newImages = await Promise.all(
      toUpload.map(async (file, index) => {
        const fileName = generateFileName(file.originalname);
        const { url, key } = await uploadFile({
          buffer: file.buffer,
          fileName,
          mimeType: file.mimetype,
          folder: 'Product Images',
        });
        return { url, key, isMain: existingCount === 0 && index === 0 };
      }),
    );

    product.images = [...product.images, ...newImages];
  }

  // Delete specified images from R2 + product
  if (input.deleteImageKeys && input.deleteImageKeys.length > 0) {
    const keysToDelete = new Set(input.deleteImageKeys);

    // Delete from R2 in parallel
    await Promise.allSettled(
      Array.from(keysToDelete).map((key) => deleteFile(key)),
    );

    // Remove from product.images array
    product.images = product.images.filter((img) => !keysToDelete.has(img.key));
  }

  // Update scalar fields
  if (input.title !== undefined) {
    product.title = input.title;
    product.slug = await generateUniqueSlug(input.title);
  }
  if (input.description !== undefined) product.description = input.description;
  if (input.price !== undefined) product.price = input.price;
  if (input.colors !== undefined) product.colors = input.colors;
  if (input.sizes !== undefined) product.sizes = input.sizes;
  if (input.inventory !== undefined) product.inventory = input.inventory;
  if (input.mainImageIndex !== undefined) {
    product.images = product.images.map((img, i) => ({
      ...img,
      isMain: i === input.mainImageIndex,
    }));
  }
  if (input.status !== undefined) product.status = input.status;
  if (input.category !== undefined) product.category = input.category;

  await product.save();
  return product.toJSON();
}

/** Public buyer-facing: list active products, optionally by category. */
export async function browseProducts(category?: string, search?: string) {
  const filter: Record<string, unknown> = { status: 'active' };

  if (category) {
    filter.category = category;
  }

  if (search && search.trim()) {
    filter.title = { $regex: search.trim(), $options: 'i' };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  return products;
}

export async function deleteProduct(productId: string, vendorId: string) {
  const product = await Product.findOneAndDelete({ _id: productId, vendor: vendorId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Delete images from R2
  await Promise.allSettled(
    product.images.map((img) => deleteFile(img.key)),
  );

  return { id: productId };
}
