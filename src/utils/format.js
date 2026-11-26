// ============================================================
//  format.js — تنسيق الوقت والنصوص (Time & text formatting)
//  ------------------------------------------------------------
//  دوال صغيرة بتتستخدم في كل مكان: تنسيق المدة، تحويل وقت مكتوب
//  لأرقام، تقصير النصوص، وحماية الماركداون.
//  Small helpers used everywhere: duration formatting, parsing a
//  typed time into milliseconds, truncating text, escaping Markdown.
// ============================================================
const { toLatinDigits } = require('./arabic');

// مدة بالمللي ثانية ➜ "3:35" أو "1:05:30" لو فيه ساعات.
// Milliseconds ➜ "3:35", or "1:05:30" when there are hours.
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// وقت مكتوب ➜ مللي ثانية. يقبل: 90 | 1:30 | 1:02:30 | 1m30s
// Typed time ➜ milliseconds. Accepts: 90 | 1:30 | 1:02:30 | 1m30s
function parseTime(input) {
  if (input == null) return null;
  const str = toLatinDigits(String(input)).trim().toLowerCase();
  if (/^\d+$/.test(str)) return Number(str) * 1000;
  if (/^\d+(:\d{1,2}){1,2}$/.test(str)) {
    return str.split(':').map(Number).reduce((acc, p) => acc * 60 + p, 0) * 1000;
  }
  const m = str.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (m && (m[1] || m[2] || m[3])) {
    return ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 1000;
  }
  return null;
}

// نص ➜ رقم صحيح، أو NaN لو مش رقم. بيحوّل الأرقام العربية الأول.
// Text ➜ integer, or NaN when it is not a number (Arabic digits first).
function toInt(input) {
  if (input == null) return NaN;
  const s = toLatinDigits(String(input)).trim();
  return /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN;
}

// شريط تقدّم: 🔘 بيمشي على ▬ حسب نسبة التشغيل.
// Progress bar: 🔘 moves along ▬ by the played ratio.
function progressBar(position, length, size = 16) {
  if (!length || length <= 0) return '🔴 LIVE';
  const ratio = Math.min(Math.max(position / length, 0), 1);
  const idx = Math.min(size - 1, Math.round(ratio * (size - 1)));
  let bar = '';
  for (let i = 0; i < size; i++) bar += i === idx ? '🔘' : '▬';
  return bar;
}

// قصّر النص لـ max حرف وحط … في الآخر لو أطول.
// Shorten text to max chars, adding … when it is longer.
function truncate(str, max = 60) {
  const s = String(str || '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// اهرب من رموز الماركداون في أسماء الأغاني عشان متكسرش التنسيق.
// Escape Markdown symbols in song titles so they can't break formatting.
function escapeMd(str) {
  return String(str || '').replace(/([\\*_`~|[\]])/g, '\\$1');
}

module.exports = { formatDuration, parseTime, toInt, progressBar, truncate, escapeMd };
