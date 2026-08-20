import multer from 'multer';
import path from 'path';

// Use memory storage so we can securely pipe buffers directly to Cloudinary via streams
const storage = multer.memoryStorage();

// Allowed image MIME types — explicit whitelist, no catch-all
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

// Allowed extensions as a secondary check
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB — tighter than 10 MB for security
    files: 2                    // Max 2 files per request (logo + cover for store updates)
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed formats: JPEG, PNG, WEBP, GIF, AVIF.`));
    }
  }
});
