// ساخت QR Code برای لینک منو
const express = require('express');
const QRCode = require('qrcode');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// مثال: GET /api/qr?base=https://mysite.com  ->  { url, dataUrl }
router.get('/', auth, async (req, res, next) => {
  try {
    const base = String(req.query.base || '').replace(/\/+$/, '');
    if (!/^https?:\/\/\S+$/.test(base)) return res.status(400).json({ message: 'آدرس سایت (base) معتبر نیست' });
    const user = await User.findById(req.userId).select('slug');
    const url = `${base}/m/${user.slug}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 900, margin: 2, errorCorrectionLevel: 'M' });
    res.json({ url, dataUrl });
  } catch (e) { next(e); }
});

module.exports = router;
