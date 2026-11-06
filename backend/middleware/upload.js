// آپلود عکس با multer توی پوشه uploads
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
});

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE'))),
});
