const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// تنظیمات اتصال به حساب کلادیناری تو
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// تنظیمات ذخیره‌سازی
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menuqr_foods', // اسم پوشه‌ای که عکس‌ها توش ذخیره می‌شن
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, crop: 'limit', quality: 'auto' }] // فشرده‌سازی خودکار
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
