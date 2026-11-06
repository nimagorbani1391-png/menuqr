// دسته‌بندی‌ها: لیست، ساخت، ویرایش، حذف، تغییر ترتیب
const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Item = require('../models/Item');
const View = require('../models/View');
const auth = require('../middleware/auth');
const { removeFile, str } = require('../utils/files');

const router = express.Router();
router.use(auth);
const isId = mongoose.isValidObjectId;

router.get('/', async (req, res, next) => {
  try { res.json(await Category.find({ restaurant: req.userId }).sort({ order: 1, createdAt: 1 })); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = str(req.body.name).trim();
    if (!name) return res.status(400).json({ message: 'اسم دسته‌بندی رو بنویس' });
    const last = await Category.findOne({ restaurant: req.userId }).sort({ order: -1 });
    res.status(201).json(await Category.create({ name, restaurant: req.userId, order: last ? last.order + 1 : 0 }));
  } catch (e) { next(e); }
});

// ترتیب جدید: { ids: ["id1","id2",...] }  (باید قبل از /:id بیاد)
router.put('/reorder', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(isId) : [];
    if (ids.length) {
      await Category.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id, restaurant: req.userId }, update: { $set: { order: i } } } })));
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'پیدا نشد' });
    const name = str(req.body.name).trim();
    if (!name) return res.status(400).json({ message: 'اسم دسته‌بندی رو بنویس' });
    const cat = await Category.findOneAndUpdate({ _id: req.params.id, restaurant: req.userId }, { name }, { new: true });
    if (!cat) return res.status(404).json({ message: 'پیدا نشد' });
    res.json(cat);
  } catch (e) { next(e); }
});

// حذف دسته‌بندی = حذف همه غذاهای داخلش
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'پیدا نشد' });
    const cat = await Category.findOneAndDelete({ _id: req.params.id, restaurant: req.userId });
    if (!cat) return res.status(404).json({ message: 'پیدا نشد' });
    const items = await Item.find({ category: cat._id, restaurant: req.userId });
    items.forEach((i) => removeFile(i.image));
    await View.deleteMany({ item: { $in: items.map((i) => i._id) } });
    await Item.deleteMany({ category: cat._id, restaurant: req.userId });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
