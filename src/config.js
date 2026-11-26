// ============================================================
//  config.js — كل الإعدادات في مكان واحد (All settings in one place)
//  ------------------------------------------------------------
//  الملف ده بيقرا الإعدادات من `.env` (لو موجودة) وبيحط قيم افتراضية
//  لو مش موجودة. أي إعداد عايز تغيّره، غيّره من `.env` —
//  ومتعدّلش هنا إلا لو فاهم بتعمل إيه.
//  Reads settings from `.env` (when present), falling back to the
//  defaults below. Change settings in `.env`, not here.
// ============================================================
const fs = require('fs');
const path = require('path');

// ---------- التوكنات — Bot tokens ----------
// من متغير TOKENS في .env، أو من ملف tokens.txt (كل توكن في سطر).
// السطور اللي بتبدأ بـ # بتتجاهل. التوكنات المكررة بتتاخد مرة واحدة.
// From the TOKENS env var, or from tokens.txt (one token per line).
// Lines starting with # are ignored; duplicates are taken once.
function loadTokens() {
  const set = new Set();
  if (process.env.TOKENS) {
    process.env.TOKENS.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean).forEach((t) => set.add(t));
  }
  const file = path.join(__dirname, '..', 'tokens.txt');
  if (fs.existsSync(file)) {
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .forEach((t) => set.add(t));
  }
  return [...set];
}

// ---------- سيرفر الصوت — Audio server nodes ----------
// البوت بيتصل بـ NodeLink عن طريق Shoukaku. اسم المتغير LAVALINK_NODES
// متوارث من Lavalink (Shoukaku بيسمّي السيرفرات "nodes")، لكن السيرفر
// الفعلي هو NodeLink على بورت 3000 — مش Lavalink (واقف).
// The bot talks to NodeLink through Shoukaku. The env var is still called
// LAVALINK_NODES (Shoukaku's name for audio servers), but the real server
// is NodeLink on port 3000 — not Lavalink (which is stopped).
// الصيغة: name|host:port|password|secure — وافصل بين السيرفرات بـ ;
// Format: name|host:port|password|secure — separate servers with ;
function parseNodes() {
  const raw = process.env.LAVALINK_NODES || 'main|localhost:3000|your_nodelink_password|false';
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry, i) => {
      const [name, url, auth, secure] = entry.split('|').map((x) => (x || '').trim());
      return {
        name: name || `node-${i + 1}`,
        url: url || 'localhost:3000',
        auth: auth || 'your_nodelink_password',
        secure: secure === 'true',
      };
    });
}

// رقم من .env أو القيمة الافتراضية لو مش رقم.
// Number from .env, or the default when it is not a number.
const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);

// ---------- البريفكس — Per-bot prefixes ----------
// كل بوت ليه بريفكس خاص بيه عشان البوتات الكتير في tokens.txt
// ميردّوش كلهم على نفس البريفكس. حط JMUSIC_PREFIXES في .env
// مفصولة بفاصلة، واحد لكل بوت بالترتيب (مثال: JMUSIC_PREFIXES=!,!2,!3,$).
// لو مش مكتوبة، بتتولد تلقائي: البوت الأول "!"، التاني "!2"، التالت "!3"...
// Each bot gets its OWN prefix so many bots in one tokens.txt don't all
// answer to the same one. Set JMUSIC_PREFIXES in .env, comma-separated,
// one per bot in order (e.g. JMUSIC_PREFIXES=!,!2,!3,$).
// When unset, prefixes are auto-generated: Bot#1 "!", Bot#2 "!2", ...
function parseBotPrefixes() {
  const raw = (process.env.JMUSIC_PREFIXES || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (raw.length) return raw;
  return null; // auto-generate below
}
const configuredPrefixes = parseBotPrefixes();
function defaultBotPrefix(index) {
  if (configuredPrefixes && configuredPrefixes[index]) return configuredPrefixes[index];
  if (configuredPrefixes && configuredPrefixes.length) return configuredPrefixes[configuredPrefixes.length - 1];
  return index === 0 ? '!' : `!${index + 1}`;
}

// ---------- الإعدادات — The settings object ----------
const config = {
  // سيرفرات الصوت (NodeLink) — Audio servers (NodeLink)
  nodes: parseNodes(),
  // مصدر البحث الافتراضي (ytsearch = يوتيوب) — Default search source
  defaultSearch: process.env.DEFAULT_SEARCH || 'ytsearch',
  // الصوت الافتراضي — Default volume (0-150)
  defaultVolume: num(process.env.DEFAULT_VOLUME, 100),
  // أقصى صوت — Max volume
  maxVolume: num(process.env.MAX_VOLUME, 150),
  // أقصى عدد أغاني في القائمة — Max queue size
  maxQueue: num(process.env.MAX_QUEUE, 500),
  // البوت غير المثبت يخرج بعد كام مللي ثانية لو الروم فضي أو القائمة خلصت
  // Idle-leave delay (ms) for unpinned bots
  leaveAfterMs: num(process.env.LEAVE_AFTER_SECONDS, 120) * 1000,
  // رسالة Now Playing التلقائية مع بداية كل أغنية. افتراضي: مقفولة —
  // رد الـ play بس هو اللي بيظهر. حط NP_AUTO=true لو عايزها ترجع.
  // Auto Now Playing message on track start. Default OFF — only the
  // play reply shows. Set NP_AUTO=true to bring it back.
  npAuto: process.env.NP_AUTO === 'true',
  // آيديهات أصحاب البوت — Owner user IDs (comma-separated).
  // حطهم في .env (OWNER_IDS) — من غيرهم مفيش أوامر Owner.
  // Set them in .env (OWNER_IDS) — without them, no Owner commands run.
  ownerIds: (process.env.OWNER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
  // لون الإمبيديد: سماوي (لون شعار Sky) — متثبّت هنا، ومش بيتقري من .env
  // عشان قيمة قديمة في .env متبوّظش الشكل.
  // Embed color: sky blue (Sky logo color) — hardcoded here on purpose,
  // never read from .env, so a stale value there can't break the look.
  embedColor: '#7EA6D8',
  errorColor: '#7EA6D8',
  // الحالة اللي بتظهر عند التشغيل — متثبّتة "By Memo" ومش بتتقري من .env.
  // Startup status — hardcoded to "By Memo", never read from .env.
  status: 'By Memo',
  // تأخير بين تسجيل دخول كل بوت والتاني (عشان ديسكورد ميعملش rate limit)
  // Delay between each bot's login (avoids Discord rate limits).
  loginDelayMs: 1500,
  // إعدادات بأسلوب JMusicBot (شوف config.example.txt في السورس القديم).
  // البريفكس بتاع كل سيرفر بيتحفظ في data/settings.json وبيغلّب ده.
  // JMusicBot-style defaults. The per-guild prefix lives in
  // data/settings.json and overrides this.
  jmusic: {
    prefix: process.env.JMUSIC_PREFIX || '!',
    prefixes: configuredPrefixes, // null = auto (!, !2, !3, ...)
    maxTimeSeconds: num(process.env.JMUSIC_MAX_TIME, 0), // 0 = no limit
    maxYtPlaylistPages: num(process.env.JMUSIC_MAX_YT_PLAYLIST_PAGES, 10),
    stayInChannel: process.env.JMUSIC_STAY_IN_CHANNEL === 'true',
    songInStatus: process.env.JMUSIC_SONG_IN_STATUS === 'true',
    npImages: process.env.JMUSIC_NP_IMAGES === 'true',
    playlistsFolder: process.env.JMUSIC_PLAYLISTS_FOLDER || 'Playlists',
    evalEnabled: false, // أمر eval مقفول على طول — مينفعش يتفعّل أبدًا.
    // The eval command stays DISABLED — never enable it.
  },
};

module.exports = { config, loadTokens, defaultBotPrefix };
