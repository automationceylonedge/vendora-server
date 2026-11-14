import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/api-response.js';
import * as authService from './auth.service.js';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  sendSuccess(res, result, 'Account created successfully', 201);
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signin(req.body);
  sendSuccess(res, result, 'Signed in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});

export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.googleSignin(req.body);
  sendSuccess(res, result, 'Signed in with Google');
});
