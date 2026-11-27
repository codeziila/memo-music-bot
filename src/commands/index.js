// ============================================================
//  commands/index.js — محمّل الأوامر (Command loader)
//  ------------------------------------------------------------
//  بيجمع كل أوامر البوت من ملفاتها (كل أمر في ملف لوحده)،
//  ويعمل خريطة بحث بالاسم الإنجليزي والعربي عشان الراوتر يلاقي
//  الأمر بسرعة من أي اسم أو alias.
//  Collects every bot command from its own file (one file per command)
//  and builds a lookup map by English and Arabic name/alias so the
//  router can find a command fast from any name or alias.
//  ------------------------------------------------------------
//  عشان تضيف أمر جديد: اعمل ملف في الفولدر المناسب (music / admin /
//  owner / general)، وبعدين سجّله في القايمة تحت.
//  To add a new command: create its file in the right folder (music /
//  admin / owner / general), then register it in the list below.
// ============================================================
const { normalize } = require('../utils/arabic');

// ---------- كل الأوامر (مرتبة حسب الكاتيجوري) — All commands ----------
const commands = [
  // ----- عامة (General) -----
  require('./general/help'),
  require('./general/ping'),
  require('./general/about'),

  // ----- موسيقى (Music) -----
  require('./music/play'),
  require('./music/playnext'),
  require('./music/search'),
  require('./music/spsearch'),
  require('./music/scsearch'),
  require('./music/skip'),
  require('./music/forceskip'),
  require('./music/stop'),
  require('./music/pause'),
  require('./music/resume'),
  require('./music/queue'),
  require('./music/nowplaying'),
  require('./music/history'),
  require('./music/remove'),
  require('./music/forceremove'),
  require('./music/shuffle'),
  require('./music/volume'),
  require('./music/repeat'),
  require('./music/skipto'),
  require('./music/movetrack'),
  require('./music/seek'),
  require('./music/lyrics'),
  require('./music/playlists'),
  require('./music/previous'),
  require('./music/replay'),
  require('./music/filter'),
  require('./music/join'),

  // ----- إدارة السيرفر (Admin) -----
  require('./admin/pin'),
  require('./admin/unpin'),
  require('./admin/pinall'),
  require('./admin/unpinall'),
  require('./admin/bots'),
  require('./admin/restart'),
  require('./admin/settings'),
  require('./admin/prefix'),
  require('./admin/setdj'),
  require('./admin/settc'),
  require('./admin/setvc'),
  require('./admin/queuetype'),

  // ----- صاحب البوت (Owner) -----
  require('./owner/setname'),
  require('./owner/setgame'),
  require('./owner/setstatus'),
  require('./owner/setavatar'),
  require('./owner/shutdown'),
  require('./owner/debug'),
  require('./owner/eval'),
  require('./owner/clearchannel'),
  require('./owner/autoplaylist'),
  require('./owner/playlist'),
];

// خريطة البحث: "اسم/alias مظبّط" ➜ { cmd, lang }
// Lookup map: "normalized name/alias" ➜ { cmd, lang }
const lookup = new Map();

function addKeys(cmd, keys, lang) {
  for (const key of keys || []) {
    const n = normalize(key);
    if (!n) continue;
    // جملة 3 كلمات ("بلاي ليست") ليها أولوية أعلى من كلمة واحدة —
    // بنسجّلها الأول، فاللي يتطابق يفوز.
    // A 3-word phrase ("بلاي ليست") outranks a single word — register it
    // first, so the first match wins.
    if (!lookup.has(n)) lookup.set(n, { cmd, lang });
  }
}

for (const cmd of commands) {
  if (cmd.name) addKeys(cmd, [cmd.name, ...(cmd.aliases || [])], 'en');
  addKeys(cmd, cmd.ar || [], 'ar');
  addKeys(cmd, cmd.aliases || [], 'en');
}

// طابق كلمات الرسالة مع الأمر (لحد 3 كلمات)، ورجّع
// { cmd, lang, used } أو null.
// Match the message words against a command (up to 3 words) and return
// { cmd, lang, used } or null.
function lookupCommand(words) {
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    const key = normalize(words.slice(0, n).join(' '));
    if (!key) continue;
    const hit = lookup.get(key);
    if (hit) return { cmd: hit.cmd, lang: hit.lang, used: n };
  }
  return null;
}

module.exports = { commands, lookup, lookupCommand };
