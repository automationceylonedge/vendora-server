import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/api-response.js';
import * as adminService from './admin.service.js';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getStats();
  sendSuccess(res, stats, 'Admin stats fetched successfully');
});

export const listVendors = asyncHandler(async (_req: Request, res: Response) => {
  const vendors = await adminService.listVendors();
  sendSuccess(res, vendors, 'Vendors fetched successfully');
});

export const listProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await adminService.listAllProducts();
  sendSuccess(res, products, 'Products fetched successfully');
});
