// ============================================================
//  store/pins.js — البوتات المثبتة في رومات صوتية (Pinned bots)
//  ------------------------------------------------------------
//  لما بوت يتثبّت في روم (أمر `ثبت`)، بنحفظ هنا: أنهي بوت، أنهي سيرفر،
//  أنهي روم. التثبيت بيفضل محفوظ حتى بعد الريستارت، والبوت بيرجع
//  للروم المثبت فيه أول ما يشتغل.
//  When a bot is pinned to a voice channel (`ثبت`), we save here:
//  which bot, which guild, which channel. Pins survive restarts —
//  the bot rejoins its pinned channel as soon as it starts.
//  بتتحفظ في data/pins.json — Persisted to data/pins.json.
// ============================================================
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '..', 'data');
const file = path.join(dir, 'pins.json');

let data = {};
try {
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
} catch (e) {
  console.error('[pins] could not read pins.json, starting empty:', e.message);
  data = {};
}

// حفظ آمن (ملف مؤقت الأول وبعدين تبديل) — Safe save (temp file, then rename).
function save() {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  } catch (e) {
    console.error('[pins] save failed:', e.message);
  }
}

module.exports = {
  // هات تثبيت بوت في سيرفر (أو null لو مش متثبت).
  // Get a bot's pin in a guild (or null when not pinned).
  get(botId, guildId) {
    return (data[botId] && data[botId][guildId]) || null;
  },

  // ثبّت بوت في روم. — Pin a bot to a channel.
  set(botId, guildId, value) {
    if (!data[botId]) data[botId] = {};
    data[botId][guildId] = { ...value, pinnedAt: Date.now() };
    save();
  },

  // فك تثبيت بوت في سيرفر. بيرجّع true لو كان متثبت فعلاً.
  // Unpin a bot in a guild. Returns true when it was pinned.
  remove(botId, guildId) {
    if (data[botId] && data[botId][guildId]) {
      delete data[botId][guildId];
      save();
      return true;
    }
    return false;
  },

  // كل التثبيتات بتاعة بوت معيّن (عشان يرجع لرومه بعد الريستارت).
  // All pins of one bot (so it can rejoin after a restart).
  forBot(botId) {
    return Object.entries(data[botId] || {}).map(([guildId, v]) => ({ guildId, ...v }));
  },
};
