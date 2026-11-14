import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/api-response.js';
import * as orderService from './order.service.js';

/** Express 5 params may return string | string[] */
function param(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : (val ?? '');
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.userId, req.body);
  sendSuccess(res, order, 'Order placed successfully', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.listOrders(
    req.user!.userId,
    req.user!.userType,
  );
  sendSuccess(res, orders);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(
    param(req.params.id),
    req.user!.userId,
    req.user!.userType,
  );
  sendSuccess(res, order);
});

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.updateOrderStatus(
      param(req.params.id),
      req.user!.userId,
      req.body.status,
    );
    sendSuccess(res, order, 'Order status updated');
  },
);
