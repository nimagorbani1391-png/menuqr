// غذاها: لیست، ساخت، ویرایش، حذف، فعال/غیرفعال، تغییر ترتیب
const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Category = require('../models/Category');
const View = require('../models/View');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { removeFile, str, toNumber } = require('../utils/files');

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

// اگه ورودی اشتباه بود، عکسی که تازه آپلود شده رو هم پاک کن
function fail(req, res, message, status = 400) {
  if (req.file) removeFile(`/uploads/${req.file.filename}`);
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
    const name = str(req.body.name).trim();
    const price = toNumber(req.body.price);
    if (!name) return fail(req, res, 'اسم غذا رو بنویس');
    if (!Number.isFinite(price) || price < 0) return fail(req, res, 'قیمت باید عدد باشه');
    if (!isId(req.body.category) || !(await Category.exists({ _id: req.body.category, restaurant: req.userId }))) {
      return fail(req, res, 'دسته‌بندی معتبر نیست');
    }
    const item = await Item.create({
      name, price,
      description: str(req.body.description),
      ingredients: str(req.body.ingredients),
      tags: parseTags(req.body.tags),
      category: req.body.category,
      restaurant: req.userId,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      order: await nextOrder(req.userId, req.body.category),
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.put('/reorder', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(isId) : [];
    if (ids.length) {
      await Item.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id, restaurant: req.userId }, update: { $set: { order: i } } } })));
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/:id', upload.single('image'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return fail(req, res, 'پیدا نشد', 404);
    const item = await Item.findOne({ _id: req.params.id, restaurant: req.userId });
    if (!item) return fail(req, res, 'پیدا نشد', 404);
    const b = req.body;
    if (b.name !== undefined) {
      if (!str(b.name).trim()) return fail(req, res, 'اسم غذا رو بنویس');
      item.name = str(b.name).trim();
    }
    if (b.price !== undefined) {
      const price = toNumber(b.price);
      if (!Number.isFinite(price) || price < 0) return fail(req, res, 'قیمت باید عدد باشه');
      item.price = price;
    }
    if (b.description !== undefined) item.description = str(b.description);
    if (b.ingredients !== undefined) item.ingredients = str(b.ingredients);
    if (b.tags !== undefined) item.tags = parseTags(b.tags);
    if (b.category !== undefined && String(b.category) !== String(item.category)) {
      if (!isId(b.category) || !(await Category.exists({ _id: b.category, restaurant: req.userId }))) return fail(req, res, 'دسته‌بندی معتبر نیست');
      item.category = b.category;
      item.order = await nextOrder(req.userId, b.category);
    }
    if (req.file) { removeFile(item.image); item.image = `/uploads/${req.file.filename}`; }
    else if (b.removeImage === 'true') { removeFile(item.image); item.image = ''; }
    await item.save();
    res.json(item);
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
    removeFile(item.image);
    await View.deleteMany({ item: item._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
