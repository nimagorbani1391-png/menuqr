// مدل صاحب رستوران (هر کاربر = یک رستوران)
const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  logo: { type: String, default: '' },
  brandColor: { type: String, default: '#ea580c' },
}, { timestamps: true });

// آدرس کوتاه و یکتا برای منو (مثلاً /m/a1b2c3d4)
userSchema.pre('validate', async function () {
  if (this.slug) return;
  for (let i = 0; i < 5; i++) {
    const candidate = crypto.randomBytes(4).toString('hex');
    if (!(await this.constructor.exists({ slug: candidate }))) { this.slug = candidate; return; }
  }
  throw new Error('slug generation failed');
});

module.exports = mongoose.model('User', userSchema);
