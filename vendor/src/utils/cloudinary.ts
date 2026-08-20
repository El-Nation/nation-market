/**
 * Processes a raw Cloudinary URL and dynamically injects the best-practice
 * rendering transformations (f_auto, q_auto) and width limits for client scalability.
 * This guarantees we rarely deliver large uncompressed blobs to end customers.
 */
export const optimizeCloudinaryUrl = (
  originalUrl: string | null | undefined, 
  width: number = 600,
  cropType: string = 'limit'
): string => {
  if (!originalUrl) return '';
  if (!originalUrl.includes('cloudinary.com')) return originalUrl;
  
  // Standard format: .../upload/v123456789/...
  // We want: .../upload/w_600,c_limit,f_auto,q_auto/v123456789/...
  const uploadPart = '/upload/';
  if (!originalUrl.includes(uploadPart)) return originalUrl;

  const transformString = `w_${width},c_${cropType},f_auto,q_auto`;
  return originalUrl.replace(uploadPart, `${uploadPart}${transformString}/`);
};
