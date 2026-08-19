import multer from 'multer';

/**
 * Multer middleware configured for in-memory storage.
 *
 * Usage in a route:
 * ```
 * import { upload } from '../../shared/middleware/upload';
 * router.post('/upload', upload.single('file'), controller.upload);
 * ```
 *
 * The parsed file is available at `req.file` as a `Express.Multer.File`
 * with a `buffer` property you pass directly to the R2 utility.
 *
 * Limits:
 * - Single file (use `.array()` or `.fields()` for multiples)
 * - 100 MB max file size
 * - Only allows images, videos, audio, and PDFs
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'application/pdf',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});
