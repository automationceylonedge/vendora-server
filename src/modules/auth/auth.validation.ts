import { z } from 'zod';

export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Google OAuth sign-in.
 * - Mobile (`android`/`ios`): sends the Google `idToken` for direct verification.
 * - Web: sends an authorization `code` (obtained from Google's auth endpoint) plus the
 *   `redirectUri` it was requested with, so the server can exchange it for an ID token.
 */
export const googleSigninSchema = z
  .object({
    idToken: z.string().min(1, 'Google token is required').optional(),
    code: z.string().min(1, 'Authorization code is required').optional(),
    redirectUri: z.string().optional(),
    platform: z.enum(['web', 'android', 'ios']),
  })
  .refine((data) => Boolean(data.idToken) || Boolean(data.code), {
    message: 'Either idToken or code is required',
    path: ['idToken'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type GoogleSigninInput = z.infer<typeof googleSigninSchema>;
