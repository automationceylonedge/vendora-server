import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../../shared/utils/api-response.js';
import * as sliderService from './slider.service.js';

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export const listActive = asyncHandler(async (req: Request, res: Response) => {
  const sliders = await sliderService.listActiveSliders();
  sendSuccess(res, sliders, 'Sliders fetched successfully');
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const sliders = await sliderService.listAllSliders();
  sendSuccess(res, sliders, 'Sliders fetched successfully');
});

export const addSlider = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendError(res, 'An image file is required', 400);
  }

  const fileName = generateFileName(req.file.originalname);
  const slider = await sliderService.addSlider({
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    fileName,
  });

  sendSuccess(res, slider, 'Slide added successfully', 201);
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  const sliders = await sliderService.reorderSliders(ids ?? []);
  sendSuccess(res, sliders, 'Slider order updated successfully');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
  if (!id) {
    return sendError(res, 'A slide id is required', 400);
  }
  await sliderService.removeSlider(id);
  sendSuccess(res, null, 'Slide removed successfully');
});
