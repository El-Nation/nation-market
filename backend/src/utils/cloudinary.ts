import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Cloudinary initialization happens in src/index.ts via cloudinary.config({ ... })

/**
 * Upload a buffer to Cloudinary with:
 *   - f_auto  → serves WebP/AVIF to modern browsers, JPEG to legacy
 *   - q_auto  → Cloudinary picks the lowest quality that looks acceptable
 *   - w/h     → server-side resize so originals are never delivered
 *
 * Returns { secure_url, public_id } — BOTH must be stored in the database.
 * secure_url is used for display; public_id is required for deletion.
 */
export const uploadImageToCloudinary = (
  buffer: Buffer,
  folder: string,
  width?: number,
  height?: number,
  crop: string = 'limit'
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Build transformation array: always apply f_auto + q_auto
    const transformation: object[] = [
      { fetch_format: 'auto', quality: 'auto' },
      ...(width && height
        ? [{ width, height, crop }]
        : width
        ? [{ width, crop }]
        : [])
    ];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );

    const rs = new Readable();
    rs.push(buffer);
    rs.push(null);
    rs.pipe(uploadStream);
  });
};

/**
 * Delete a Cloudinary asset by its public_id.
 * Always call this when replacing or deleting a stored image.
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
  }
};
