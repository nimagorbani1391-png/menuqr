// ابزارهای کمکی: حذف عکس، تبدیل عدد فارسی، پاک‌سازی ورودی
const fs = require('fs');
const path = require('path');

exports.removeFile = (rel) => {
  if (!rel || !rel.startsWith('/uploads/')) return;
  fs.unlink(path.join(__dirname, '..', rel), () => {});
};

exports.str = (v) => (typeof v === 'string' ? v : '');

// "۱۲٬۵۰۰" یا "12,500" -> 12500
exports.toNumber = (v) => {
  const s = String(v ?? '')
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 1776)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
    .replace(/[,٬\s]/g, '');
  return s === '' ? NaN : Number(s);
};
