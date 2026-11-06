const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Category = require('../models/Category');
const View = require('../models/View');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(auth);
const isId = mongoose.isValidObjectId;

function parseTags(raw) {
  let list = raw;
  if (typeof list === 'string') {
    try { const j = JSON.parse(list); list = Array.isArray(j) ? j : list.split(','); } catch (e) { list = list.split(','); }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((t) => String(t).trim()).filter((t) => Item.TAGS.includes(t)))];
}

function fail(req, res, message, status = 400) {
  return res.status(status).json({ message });
}

async function nextOrder(restaurant, category) {
  const last = await Item.findOne({ restaurant, category }).sort({ order: -1 });
  return last ? last.order + 1 : 0;
}

router.get('/', async (req, res, next) => {
  try {
    const filter = { restaurant: req.userId };
    if (isId(req.query.category)) filter.category = req.query.category;
    res.json(await Item.find(filter).sort({ order: 1, createdAt: 1 }));
  } catch (e) { next(e); }
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const name = req.body.name ? req.body.name.trim() : '';
    const price = Number(req.body.price);
    
    if (!name) return fail(req, res, 'اسم غذا رو بنویس');
    if (!Number.isFinite(price) || price < 0) return fail(req, res, 'قیمت باید عدد باشه');
    if (!isId(req.body.category) || !(await Category.exists({ _id: req.body.category, restaurant: req.userId }))) {
      return fail(req, res, 'دسته‌بندی معتبر نیست');
    }

    // لینک عکس مستقیماً از کلادیناری میاد
    const imageUrl = req.file ? req.file.path : '';

    const item = await Item.create({
      name, 
      price,
      description: req.body.description || '',
      tags: parseTags(req.body.tags),
      category: req.body.category,
      restaurant: req.userId,
      image: imageUrl,
      order: await nextOrder(req.userId, req.body.category),
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'پیدا نشد' });
    const item = await Item.findOne({ _id: req.params.id, restaurant: req.userId });
    if (!item) return res.status(404).json({ message: 'پیدا نشد' });
    item.isActive = !item.isActive;
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'پیدا نشد' });
    const item = await Item.findOneAndDelete({ _id: req.params.id, restaurant: req.userId });
    if (!item) return res.status(404).json({ message: 'پیدا نشد' });
    await View.deleteMany({ item: item._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
