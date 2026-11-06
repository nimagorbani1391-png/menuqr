// نگهبان: فقط کسی که توکن معتبر داره رد می‌شه
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'اول وارد حساب خودت شو' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch (e) {
    res.status(401).json({ message: 'نشست تموم شده؛ دوباره وارد شو' });
  }
};
