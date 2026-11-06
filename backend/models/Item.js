// مدل غذا
const mongoose = require('mongoose');
const TAGS = ['spicy', 'vegetarian', 'glutenFree'];

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '', trim: true },
  ingredients: { type: String, default: '', trim: true },
  image: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tags: [{ type: String, enum: TAGS }],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
Item.TAGS = TAGS;
module.exports = Item;
