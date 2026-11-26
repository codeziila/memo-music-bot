// ============================================================
//  arabic.js — توحيد الكتابة العربية (Arabic text normalizing)
//  ------------------------------------------------------------
//  عشان "أوقف" و"اوقف" و"إيقاف" و"ايقاف" تتفهم زي بعض — بنوحّد الهمزات
//  والتاء المربوطة والألف المقصورة قبل ما نقارن الأوامر.
//  So "أوقف", "اوقف", "إيقاف" and "ايقاف" all match — we unify hamzas,
//  ة/ه and ى/ي before comparing commands.
// ============================================================
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

// وحّد الكتابة: شيل التشكيل والتطويل، ووحّد الهمزات والتاء والألف.
// Normalize: strip diacritics/tatweel, unify hamzas, ة➜ه, ى➜ي.
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// حوّل الأرقام العربية والفارسية (١٢٣ / ۱۲۳) لأرقام إنجليزي (123).
// Convert Arabic/Persian digits (١٢٣ / ۱۲۳) to Latin digits (123).
function toLatinDigits(text) {
  return String(text)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// هل النص فيه حروف عربية؟ — Does the text contain Arabic letters?
const isArabic = (s) => /[\u0600-\u06FF]/.test(s);

module.exports = { normalize, toLatinDigits, isArabic };
