// مدل دسته‌بندی (پیش‌غذا، دسر، ...)
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
