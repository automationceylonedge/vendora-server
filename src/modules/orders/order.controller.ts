import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { sendSuccess } from '../../shared/utils/api-response';
import * as orderService from './order.service';

/** Express 5 params may return string | string[] */
function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val ?? '');
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.userId, req.body);
  sendSuccess(res, order, 'Order placed successfully', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getMyOrders(req.user!.userId);
  sendSuccess(res, orders);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(
    param(req.params.id),
    req.user!.userId,
  );
  sendSuccess(res, order);
});
