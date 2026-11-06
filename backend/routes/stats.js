// آمار ساده برای صاحب رستوران
const express = require('express');
const mongoose = require('mongoose');
const View = require('../models/View');
const Item = require('../models/Item');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();
const TZ = 'Asia/Tehran'; // اگه کشور دیگه‌ای هستی اینو عوض کن
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }); // خروجی: 2026-11-04

router.get('/', auth, async (req, res, next) => {
  try {
    const restaurant = new mongoose.Types.ObjectId(req.userId);
    const todayStr = dayFmt.format(new Date());
    const startOfToday = new Date(`${todayStr}T00:00:00+03:30`); // تهران بدون ساعت تابستانی
    const DAY = 86400000;
    const from = new Date(startOfToday.getTime() - 6 * DAY);

    const [menuViewsTotal, menuViewsToday, daily, topItems, categoriesCount, itemsCount] = await Promise.all([
      View.countDocuments({ restaurant, type: 'menu' }),
      View.countDocuments({ restaurant, type: 'menu', createdAt: { $gte: startOfToday } }),
      View.aggregate([
        { $match: { restaurant, type: 'menu', createdAt: { $gte: from } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } },
      ]),
      View.aggregate([
        { $match: { restaurant, type: 'item' } },
        { $group: { _id: '$item', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $project: { _id: 0, itemId: '$_id', name: '$item.name', views: 1 } },
      ]),
      Category.countDocuments({ restaurant }),
      Item.countDocuments({ restaurant }),
    ]);

    const byDay = Object.fromEntries(daily.map((d) => [d._id, d.count]));
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayFmt.format(new Date(startOfToday.getTime() - i * DAY + 3600000));
      last7Days.push({ date: key, count: byDay[key] || 0 });
    }
    res.json({ menuViewsTotal, menuViewsToday, last7Days, topItems, categoriesCount, itemsCount });
  } catch (e) { next(e); }
});

module.exports = router;
