import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { env } from '../../config/env';

let r2Client: S3Client | null = null;

/**
 * Initialise the Cloudflare R2 S3-compatible client.
 * Called once during server bootstrap.
 */
export function initializeR2(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: env.r2.endpoint,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
    console.log('✅ Cloudflare R2 client initialised');
  }
  return r2Client;
}

/**
 * Get the singleton R2 client (throws if not initialised).
 */
function getClient(): S3Client {
  if (!r2Client) {
    throw new Error('R2 client not initialised. Call initializeR2() first.');
  }
  return r2Client;
}

/* ────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────── */

export interface R2UploadInput {
  /** Raw file buffer */
  buffer: Buffer;
  /** File name including extension, e.g. "avatar.png" */
  fileName: string;
  /** MIME type, e.g. "image/png" */
  mimeType: string;
  /** Folder prefix, e.g. "Profile Pictures" or "Product Images" */
  folder: string;
}

export interface R2UploadResult {
  /** Full object key in the bucket, e.g. "Profile Pictures/avatar.png" */
  key: string;
  /** Publicly accessible URL */
  url: string;
}

/**
 * Upload a file to Cloudflare R2.
 *
 * @example
 * const { url, key } = await uploadFile({
 *   buffer: req.file!.buffer,
 *   fileName: req.file!.originalname,
 *   mimeType: req.file!.mimetype,
 *   folder: 'Profile Pictures',
 * });
 */
export async function uploadFile(input: R2UploadInput): Promise<R2UploadResult> {
  const { buffer, fileName, mimeType, folder } = input;
  const key = `${folder}/${fileName}`;

  const params: PutObjectCommandInput = {
    Bucket: env.r2.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await getClient().send(new PutObjectCommand(params));

  return {
    key,
    url: getPublicUrl(key),
  };
}

/**
 * Delete a file from Cloudflare R2 by its object key.
 *
 * @example
 * await deleteFile('Profile Pictures/avatar.png');
 */
export async function deleteFile(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.r2.bucketName,
      Key: key,
    }),
  );
}

/**
 * Build the public URL for an R2 object key.
 */
export function getPublicUrl(key: string): string {
  const base = env.r2.publicUrl.replace(/\/+$/, '');
  return `${base}/${key}`;
}
