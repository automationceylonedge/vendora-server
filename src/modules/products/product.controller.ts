import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/api-response.js';
import * as productService from './product.service.js';

/** Express 5 params may return string | string[] */
function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val ?? '');
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const product = await productService.createProduct(
    req.user!.userId,
    req.body,
    files,
  );

  sendSuccess(res, product, 'Product created successfully', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const minPrice = typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined;
  const maxPrice = typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const products = await productService.getVendorProducts(
    req.user!.userId,
    search,
    Number.isNaN(minPrice) ? undefined : minPrice,
    Number.isNaN(maxPrice) ? undefined : maxPrice,
    category,
  );
  sendSuccess(res, products);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(param(req.params.id));
  sendSuccess(res, product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const product = await productService.updateProduct(
    param(req.params.id),
    req.user!.userId,
    req.body,
    files,
  );

  sendSuccess(res, product, 'Product updated successfully');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(param(req.params.id), req.user!.userId);
  sendSuccess(res, null, 'Product deleted successfully');
});

/** Public buyer-facing: list active products. */
export const browse = asyncHandler(async (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const products = await productService.browseProducts(category, search);
  sendSuccess(res, products);
});
