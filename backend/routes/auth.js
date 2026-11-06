// ثبت‌نام، ورود، اطلاعات رستوران و لوگو
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { removeFile, str } = require('../utils/files');

const router = express.Router();
const signToken = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, restaurantName: u.restaurantName, slug: u.slug, logo: u.logo, brandColor: u.brandColor });
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

router.post('/register', async (req, res, next) => {
  try {
    const email = str(req.body.email).toLowerCase().trim();
    const password = str(req.body.password);
    const restaurantName = str(req.body.restaurantName).trim();
    if (!isEmail(email)) return res.status(400).json({ message: 'ایمیل معتبر نیست' });
    if (password.length < 6) return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشه' });
    if (!restaurantName) return res.status(400).json({ message: 'اسم رستوران رو بنویس' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'با این ایمیل قبلاً ثبت‌نام شده' });
    const user = await User.create({ name: str(req.body.name), email, restaurantName, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: str(req.body.email).toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(str(req.body.password), user.password))) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباهه' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'حساب پیدا نشد' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

router.put('/restaurant', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const name = str(req.body.restaurantName).trim();
    const color = str(req.body.brandColor).trim();
    if (name) user.restaurantName = name;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) user.brandColor = color;
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post('/logo', auth, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'عکسی انتخاب نشده' });
    const user = await User.findById(req.userId);
    removeFile(user.logo);
    user.logo = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

module.exports = router;
