import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => {
    return {
      folder: 'covers',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'image',
    };
  },
});
