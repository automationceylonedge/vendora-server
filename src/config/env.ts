import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-dev-jwt-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  /* ── Cloudflare R2 ── */
  r2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    endpoint: process.env.R2_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.R2_PUBLIC_URL!,
  },

  /* ── PayHere ── */
  payHere: {
    merchantId: process.env.PAYHERE_MERCHANT_ID || '',
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
  },

  /* ── Google OAuth ── */
  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
    webClientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET || '',
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
  },
};
