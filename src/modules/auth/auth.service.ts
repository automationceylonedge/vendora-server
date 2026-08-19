import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import type { SignupInput, SigninInput } from './auth.validation';
import type { JwtPayload } from '../../middleware/auth';

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}

export async function signup(input: SignupInput) {
  const { firstName, lastName, email, password } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    userType: 'buyer',
    status: 'active',
  });

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save({ validateModifiedOnly: true });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

export async function signin(input: SigninInput) {
  const { email, password } = input;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save({ validateModifiedOnly: true });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  const newPayload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateModifiedOnly: true });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
