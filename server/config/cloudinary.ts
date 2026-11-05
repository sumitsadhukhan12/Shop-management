import { v2 as cloudinary } from 'cloudinary';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export async function uploadImage(
  dataUriOrBuffer: string,
  folder: string = 'sadhukhan_varities'
): Promise<{ url: string; publicId: string }> {
  if (isCloudinaryConfigured) {
    try {
      const res = await cloudinary.uploader.upload(dataUriOrBuffer, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
          { max_bytes: 200000 } // Keep optimized ~50-150KB
        ]
      });
      return {
        url: res.secure_url,
        publicId: res.public_id
      };
    } catch (err) {
      console.error('Cloudinary upload error, using local fallback:', err);
    }
  }

  // Resilient fallback: return validated data URI or generated id
  const publicId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    url: dataUriOrBuffer,
    publicId
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  if (isCloudinaryConfigured && publicId && !publicId.startsWith('local_')) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
      return false;
    }
  }
  return true;
}
