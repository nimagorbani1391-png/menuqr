// مدل بازدید (برای آمار): بازدید منو یا بازدید یک غذا
const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  type: { type: String, enum: ['menu', 'item'], required: true },
  createdAt: { type: Date, default: Date.now },
});
viewSchema.index({ restaurant: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('View', viewSchema);
