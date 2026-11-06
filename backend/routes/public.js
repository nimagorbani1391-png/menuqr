// بخش مشتری: منوی عمومی (بدون ثبت‌نام) و ثبت بازدید
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Item = require('../models/Item');
const View = require('../models/View');

const router = express.Router();

router.get('/menu/:slug', async (req, res, next) => {
  try {
    const owner = await User.findOne({ slug: req.params.slug });
    if (!owner) return res.status(404).json({ message: 'این منو پیدا نشد' });
    const [cats, items] = await Promise.all([
      Category.find({ restaurant: owner._id }).sort({ order: 1, createdAt: 1 }).lean(),
      Item.find({ restaurant: owner._id, isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
    ]);
    const categories = cats
      .map((c) => ({
        _id: c._id,
        name: c.name,
        items: items
          .filter((i) => String(i.category) === String(c._id))
          .map((i) => ({ _id: i._id, name: i.name, price: i.price, description: i.description, ingredients: i.ingredients, image: i.image, tags: i.tags })),
      }))
      .filter((c) => c.items.length > 0);
    res.json({ restaurant: { restaurantName: owner.restaurantName, logo: owner.logo, brandColor: owner.brandColor }, categories });
  } catch (e) { next(e); }
});

// بدنه: {} برای بازدید منو، یا { itemId } برای بازدید یک غذا
router.post('/menu/:slug/view', async (req, res, next) => {
  try {
    const owner = await User.findOne({ slug: req.params.slug }).select('_id');
    if (!owner) return res.status(404).json({ message: 'این منو پیدا نشد' });
    const itemId = req.body && req.body.itemId;
    if (mongoose.isValidObjectId(itemId) && (await Item.exists({ _id: itemId, restaurant: owner._id }))) {
      await View.create({ restaurant: owner._id, item: itemId, type: 'item' });
    } else {
      await View.create({ restaurant: owner._id, type: 'menu' });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
