import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/user.model.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/utils/api-error.js';
import type { SignupInput, SigninInput, GoogleSigninInput } from './auth.validation.js';
import type { JwtPayload } from '../../middleware/auth.js';

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

/** Resolve the Google client id for a given platform, or throw if unconfigured. */
function googleClientIdFor(platform: 'web' | 'android' | 'ios'): string {
  const clientId =
    platform === 'web'
      ? env.google.webClientId
      : platform === 'android'
        ? env.google.androidClientId
        : env.google.iosClientId;
  if (!clientId) {
    throw new ApiError(500, `Google OAuth is not configured for platform: ${platform}`);
  }
  return clientId;
}

/** Verified Google profile fields we rely on. */
interface GoogleProfile {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Verify a Google profile from an ID token (idToken flow, used by mobile).
 * Accepts one or more client IDs as valid audiences: mobile ID tokens are minted
 * with an `aud` of either the native (android/ios) client ID or the web client ID
 * (when `serverClientId` is set), so we accept both.
 */
async function verifyGoogleIdToken(idToken: string, clientIds: string[]): Promise<GoogleProfile> {
  const client = new OAuth2Client({ clientId: clientIds[0] });
  const ticket = await client.verifyIdToken({ idToken, audience: clientIds });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new ApiError(401, 'Invalid Google credentials');
  }
  if (!payload.email || !payload.email_verified) {
    throw new ApiError(403, 'Google account email is not verified');
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    given_name: payload.given_name,
    family_name: payload.family_name,
  };
}

/** Exchange an OAuth authorization code for an ID token (used by web). */
async function exchangeGoogleCode(clientId: string, clientSecret: string, code: string, redirectUri: string) {
  const client = new OAuth2Client({ clientId, clientSecret, redirectUri });
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri, client_id: clientId });
  if (!tokens.id_token) {
    throw new ApiError(401, 'Google authorization code exchange failed');
  }
  return verifyGoogleIdToken(tokens.id_token, [clientId]);
}

/** Find or create a user from a verified Google profile, then issue tokens. */
async function findOrCreateGoogleUser(profile: GoogleProfile) {
  let user = await User.findOne({ email: profile.email });

  if (!user) {
    user = await User.create({
      firstName: profile.given_name || 'Google',
      lastName: profile.family_name || 'User',
      email: profile.email,
      userType: 'buyer',
      status: 'active',
      googleId: profile.sub,
    });
  } else {
    // Backfill details for an existing account that signed in with Google for the first time.
    if (!user.googleId) {
      user.googleId = profile.sub;
    }
    if (!user.firstName && profile.given_name) {
      user.firstName = profile.given_name;
    }
    if (!user.lastName && profile.family_name) {
      user.lastName = profile.family_name;
    }
    if (user.isModified()) {
      await user.save({ validateModifiedOnly: true });
    }
  }

  return user;
}

export async function googleSignin(input: GoogleSigninInput) {
  const { platform } = input;
  const clientId = googleClientIdFor(platform);
  const clientSecret = env.google.webClientSecret;

  let profile: GoogleProfile;
  try {
    if (input.idToken) {
      // Mobile (android/ios): verify the ID token directly. The token's `aud`
      // is the native client ID OR the web client ID (from serverClientId).
      const audiences = [clientId, env.google.webClientId].filter(Boolean);
      profile = await verifyGoogleIdToken(input.idToken, audiences);
    } else if (input.code) {
      // Web: exchange the authorization code for an ID token, then verify it.
      if (!clientSecret) {
        throw new ApiError(500, 'Google OAuth is not configured on the server');
      }
      profile = await exchangeGoogleCode(clientId, clientSecret, input.code, input.redirectUri || '');
    } else {
      throw new ApiError(400, 'Either idToken or code is required');
    }
  } catch (err) {
    // Re-throw our own http errors; convert any Google/library failure to a clean 401.
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Google sign-in could not be verified');
  }

  const user = await findOrCreateGoogleUser(profile);

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
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
