import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../../shared/utils/api-response.js';
import { uploadFile } from '../../shared/utils/r2.js';
import * as userService from './user.service.js';
import { updateBusinessSchema } from './user.validation.js';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.userId);
  sendSuccess(res, user, 'User fetched successfully');
});

export const updateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateDelivery(req.user!.userId, req.body);
  sendSuccess(res, user, 'Delivery details saved successfully');
});

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  // Multipart text fields arrive as strings — validate businessName if present
  let businessName: string | undefined;
  if (req.body.businessName !== undefined && req.body.businessName !== '') {
    const parsed = updateBusinessSchema.safeParse({ businessName: req.body.businessName });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Invalid business name';
      return sendError(res, first);
    }
    businessName = parsed.data.businessName;
  }

  // Upload the logo if a file was provided
  let logo: { url: string; key: string } | undefined;
  if (req.file) {
    const fileName = generateFileName(req.file.originalname);
    const { url, key } = await uploadFile({
      buffer: req.file.buffer,
      fileName,
      mimeType: req.file.mimetype,
      folder: 'Business Logos',
    });
    logo = { url, key };
  }

  const user = await userService.updateBusiness(req.user!.userId, { businessName, logo });
  sendSuccess(res, user, 'Business details saved successfully');
});
