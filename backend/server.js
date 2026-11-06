// فایل اصلی سرور: همه‌چیز از اینجا شروع می‌شه
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('❌ فایل .env کامل نیست. MONGO_URI و JWT_SECRET رو توش بنویس.');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'MenuQR by NIMEX' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/items', require('./routes/items'));
app.use('/api/public', require('./routes/public'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api', (req, res) => res.status(404).json({ message: 'آدرس پیدا نشد' }));

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'حجم عکس نباید بیشتر از ۱۰ مگابایت باشه' });
  if (err && err.message === 'INVALID_FILE_TYPE') return res.status(400).json({ message: 'فقط عکس JPG، PNG یا WEBP قبوله' });
  console.error(err);
  res.status(500).json({ message: 'خطای داخلی سرور' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ به دیتابیس وصل شد');
    app.listen(PORT, () => console.log(`✅ سرور روشن شد: http://localhost:${PORT}`));
  })
  .catch((err) => { console.error('❌ وصل نشدن به دیتابیس:', err.message); process.exit(1); });
