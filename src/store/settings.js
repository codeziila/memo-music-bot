// ============================================================
//  store/settings.js — إعدادات كل سيرفر (Per-guild settings)
//  ------------------------------------------------------------
//  بتتحفظ في data/settings.json — نفس شكل إعدادات JMusicBot:
//  prefix, DJ role, text channel, voice channel, volume,
//  default playlist, repeat mode, queue type.
//  Persisted to data/settings.json — same shape as JMusicBot's Settings.
// ============================================================
const fs = require('fs');
const path = require('path');
const { config, defaultBotPrefix } = require('../config');

const dir = path.join(__dirname, '..', '..', 'data');
const file = path.join(dir, 'settings.json');

let data = {};
try {
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
} catch (e) {
  console.error('[settings] could not read settings.json, starting empty:', e.message);
  data = {};
}

// حفظ آمن: اكتب في ملف مؤقت الأول وبعدين بدّله (عشان لو البوت وقع
// في النص، الملف الأصلي يفضل سليم).
// Safe save: write to a temp file first, then rename it over the real
// one, so a crash mid-save can't corrupt the original.
function save() {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  } catch (e) {
    console.error('[settings] save failed:', e.message);
  }
}

// القيم الافتراضية لسيرفر جديد — Defaults for a new guild.
function defaults() {
  return {
    prefix: config.jmusic.prefix || '!',
    djRoleId: '0',
    textChannelId: '0',
    voiceChannelId: '0',
    volume: config.defaultVolume,
    defaultPlaylist: null,
    repeatMode: 'off', // off | single (on) — مفيش 'all' من v1.0.0 (on/off بس)
    queueType: 'fair', // fair | linear
    prefixesByBot: {}, // { botUserId: prefix } — بريفكس كل بوت، مش كل سيرفر.
  };
}

// هات إعدادات سيرفر (مع القيم الافتراضية لأي حاجة ناقصة).
// Get a guild's settings (defaults fill in anything missing).
function get(guildId) {
  const stored = data[guildId] || {};
  return { ...defaults(), ...stored };
}

// عدّل إعدادات سيرفر واحفظها. — Update a guild's settings and save.
function update(guildId, patch) {
  data[guildId] = { ...get(guildId), ...patch };
  save();
  return data[guildId];
}

// بريفكس بوت معيّن في سيرفر معيّن: لو متخزّن override للبوت ده يفوز،
// غير كدا البريفكس الافتراضي بتاع البوت (! للأول، !2 للتاني، ...).
// Per-bot prefix for a guild: a stored override for this bot wins,
// otherwise the bot's own default (! for Bot#1, !2 for Bot#2, ...).
// Bots never share one prefix.
function botPrefix(guildId, botId, botIndex) {
  const s = get(guildId);
  if (botId && s.prefixesByBot && s.prefixesByBot[botId]) return s.prefixesByBot[botId];
  return defaultBotPrefix(Number.isFinite(botIndex) ? botIndex : 0);
}

function setBotPrefix(guildId, botId, prefix) {
  const s = get(guildId);
  const map = { ...(s.prefixesByBot || {}) };
  if (prefix) map[botId] = prefix;
  else delete map[botId];
  return update(guildId, { prefixesByBot: map });
}

function reset(guildId) {
  delete data[guildId];
  save();
}

// حوّل وضع التكرار (off/single) لوضع الـ loop بتاع المشغّل (off/track).
// Map a repeat mode onto GuildMusic.loop (off/track).
// ملحوظة: 'all' (تكرار القائمة كلها) اتلغى — التكرار بقى on/off بس.
// Note: 'all' (repeat the whole queue) is gone — repeat is on/off only.
function loopForRepeatMode(mode) {
  return mode === 'single' ? 'track' : 'off';
}

function repeatModeForLoop(loop) {
  return loop === 'track' ? 'single' : 'off';
}

// طبّق الإعدادات المحفوظة على مشغّل موسيقى فاضي (لسه مش مشغّل حاجة).
// بتتنادى قبل ما أمر موسيقى يشتغل؛ عمرها ما بتكتب فوق قائمة شغالة.
// Apply stored settings to a fresh (idle) GuildMusic instance.
// Called before a music command runs; never overwrites a live queue.
function applyToMusic(music) {
  if (!music) return;
  const s = get(music.guildId);
  if (!music.current && !music.queue.length) {
    music.loop = loopForRepeatMode(s.repeatMode);
    music.queueType = s.queueType;
    if (Number.isFinite(s.volume) && s.volume >= 0 && s.volume <= config.maxVolume) {
      music.volume = s.volume;
    }
  }
}

module.exports = { get, update, reset, defaults, applyToMusic, loopForRepeatMode, repeatModeForLoop, botPrefix, setBotPrefix };
