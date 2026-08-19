import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { sendSuccess } from '../../shared/utils/api-response';
import * as userService from './user.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.userId);
  sendSuccess(res, user, 'User fetched successfully');
});

export const updateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateDelivery(req.user!.userId, req.body);
  sendSuccess(res, user, 'Delivery details saved successfully');
});
