// ============================================================
//  music/filters.js — فلاتر الصوت (Audio filters)
//  ------------------------------------------------------------
//  الفلاتر بتتطبق على الصوت اللي شغال (باس، نايتكور، 8D، ...).
//  كل فلتر ليه اسم إنجليزي، واسم عربي، وقائمة أسماء بديلة.
//  عشان تضيف فلتر جديد: زوّد إعداداته في FILTERS، واسمه العربي
//  في NAMES_AR، وأسماءه البديلة في RAW_ALIASES.
//  Filters applied to the playing audio (bass, nightcore, 8D, ...).
//  Each filter has an English name, an Arabic name, and aliases.
//  To add a filter: add its settings to FILTERS, its Arabic name to
//  NAMES_AR, and its aliases to RAW_ALIASES.
// ============================================================
const { normalize } = require('../utils/arabic');

const FILTERS = {
  // Bassboost, nightcore, vaporwave... خُفّفت (2026-11-26) عشان الصوت
  // ميبوظش على بتريت 64kbps: الباس العالي كان بيقصّ (clipping) وبيجوّع
  // الـ bitrate، والـ timescale القوي كان بيعمل تشويش. القيم دي أهدى
  // بس لسه مسموعة بوضوح. لو رفعت البتريت لـ 96kbps، الفلاتر هتبقى أنضف أكتر.
  // Filters softened (2026-11-26) so they stay clean at 64kbps: heavy
  // bass was clipping and starving the bitrate, strong timescale added
  // artifacts. These are gentler but still clearly audible.
  bassboost: {
    equalizer: [
      { band: 0, gain: 0.15 },
      { band: 1, gain: 0.12 },
      { band: 2, gain: 0.08 },
      { band: 3, gain: 0.05 },
      { band: 4, gain: 0.02 },
    ],
  },
  nightcore: { timescale: { speed: 1.15, pitch: 1.15, rate: 1 } },
  vaporwave: {
    timescale: { speed: 0.9, pitch: 0.9, rate: 1 },
    equalizer: [
      { band: 0, gain: 0.15 },
      { band: 1, gain: 0.15 },
    ],
  },
  '8d': { rotation: { rotationHz: 0.2 } },
  karaoke: { karaoke: { level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 } },
  slow: { timescale: { speed: 0.85, pitch: 1, rate: 1 } },
  speed: { timescale: { speed: 1.2, pitch: 1, rate: 1 } },
  tremolo: { tremolo: { frequency: 4, depth: 0.5 } },
};

const NAMES_AR = {
  bassboost: 'باس',
  nightcore: 'نايتكور',
  vaporwave: 'فيبرويف',
  '8d': 'ثري دي 8D',
  karaoke: 'كاريوكي',
  slow: 'بطيء',
  speed: 'سريع',
  tremolo: 'اهتزاز',
};

const RAW_ALIASES = {
  bassboost: ['bassboost', 'bass', 'bb', 'باس', 'بيس', 'باس بوست'],
  nightcore: ['nightcore', 'nc', 'نايتكور', 'نايت كور'],
  vaporwave: ['vaporwave', 'vw', 'فيبرويف', 'فابورويف'],
  '8d': ['8d', '3d', 'ثري دي', 'ثريدي', 'تمانيه دي'],
  karaoke: ['karaoke', 'كاريوكي', 'كاريوكى'],
  slow: ['slow', 'slowed', 'بطيء', 'بطيئ', 'بطئ', 'سلو'],
  speed: ['speed', 'fast', 'سريع', 'اسرع'],
  tremolo: ['tremolo', 'اهتزاز', 'رعشه'],
  reset: ['reset', 'off', 'none', 'clear', 'الغاء', 'عادي', 'ازاله', 'مسح', 'شيل', 'بدون'],
};

const ALIASES = new Map();
for (const [name, list] of Object.entries(RAW_ALIASES)) {
  for (const a of list) ALIASES.set(normalize(a), name);
}

function resolveFilter(input) {
  if (!input) return null;
  return ALIASES.get(normalize(input)) || null;
}

module.exports = { FILTERS, NAMES_AR, resolveFilter };
