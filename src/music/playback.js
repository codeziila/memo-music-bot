// ============================================================
//  music/playback.js — مساعدات التشغيل المشتركة (Playback helpers)
//  ------------------------------------------------------------
//  الدوال اللي أوامر الموسيقى كلها بتستخدمها: حلّ لينك/بحث عن طريق
//  NodeLink، إضافة أغاني للقائمة، وردّ الـ play، وتحميل ملفات
//  البلاي ليست. محطوطة هنا عشان أوامر play و playnext و search
//  وغيرها تشارك نفس الكود بدل ما يتكرر.
//  Shared helpers every music command uses: resolving a link/search
//  through NodeLink, adding tracks to the queue, the play reply,
//  and loading playlist files. They live here so play, playnext,
//  search and friends share one implementation instead of duplicating it.
// ============================================================
const fs = require('fs');
const path = require('path');
const { config } = require('../config');
const { formatDuration, truncate, escapeMd } = require('../utils/format');

const EMOJI = { success: '🎶', warning: '💡', error: '🚫', loading: '⌚', searching: '🔎' };
const isUrl = (s) => /^https?:\/\//i.test(s);

// ---------- البلاي ليستات المحلية — Local playlist files ----------
function playlistsDir() {
  return path.join(__dirname, '..', '..', config.jmusic.playlistsFolder || 'Playlists');
}

// اسم آمن لملف بلاي ليست (مسافات ➜ _، وشيل الرموز الممنوعة).
// Safe playlist file name (spaces ➜ _, strip forbidden symbols).
function playlistFile(name) {
  const safe = String(name || '')
    .replace(/\s+/g, '_')
    .replace(/[*?|\\/":<>]/g, '');
  return { safe, file: path.join(playlistsDir(), `${safe}.txt`) };
}

// أسماء كل البلاي ليستات الموجودة. — Names of all existing playlists.
function listPlaylists() {
  try {
    return fs
      .readdirSync(playlistsDir())
      .filter((f) => f.toLowerCase().endsWith('.txt'))
      .map((f) => f.slice(0, -4))
      .sort();
  } catch {
    return [];
  }
}

// حوّل كل سطر في ملف بلاي ليست (لينك أو اسم أغنية) لعناصر قائمة.
// سطر بايظ مبيبوّظش القائمة كلها — بيتخطى (زي JMusicBot).
// Resolve every line of a playlist file (URL or search query) into
// queue items. One bad line never kills the whole playlist (JMusicBot
// skips it).
async function loadPlaylistItems(bot, name, requesterId, music) {
  const { file } = playlistFile(name);
  if (!fs.existsSync(file)) return null;
  const lines = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const items = [];
  for (const line of lines) {
    if (items.length >= config.maxQueue) break;
    try {
      const identifier = isUrl(line) ? line : `${config.defaultSearch}:${line}`;
      const res = await resolveIdentifier(bot, identifier);
      if (!res) continue;
      const tracks = res.loadType === 'track' ? [res.data] : res.loadType === 'playlist' ? res.data.tracks || [] : res.loadType === 'search' ? (res.data || []).slice(0, 1) : [];
      for (const tr of tracks) {
        if (items.length >= config.maxQueue) break;
        items.push(music ? music.makeItem(tr, requesterId) : tr);
      }
    } catch {
      // One bad line must not kill the whole playlist (JMusicBot skips it).
    }
  }
  return items;
}

// ---------- حلّ الروابط والبحث — Resolving via NodeLink ----------
// حلّ معرّف NodeLink خام (مثال: "scsearch:query" أو "ytsearch:query" أو لينك).
// ---- كلمات الأغاني (من غير API key) — Lyrics (no API key) ----
// الأول lrclib (مجاني، من غير key)، وبعدين lyrics.ovh (مجاني، من غير key).
// lrclib first (free, no key), then lyrics.ovh (free, no key).
async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'discord-music-bot-jmusic/1.0' } });
  } finally {
    clearTimeout(t);
  }
}

async function fetchLyrics(title) {
  try {
    const r = await fetchWithTimeout(`https://lrclib.net/api/search?q=${encodeURIComponent(title)}`, 8000);
    if (r.ok) {
      const arr = await r.json();
      const hit = (arr || []).find((x) => x && x.plainLyrics);
      if (hit) {
        let title = hit.trackName || title;
        if (hit.artistName && title.toLowerCase().startsWith(`${hit.artistName.toLowerCase()} - `)) title = title.slice(hit.artistName.length + 3);
        return { title, author: hit.artistName, url: `https://lrclib.net/track/${hit.id}`, content: hit.plainLyrics };
      }
    }
  } catch {
    /* fall through to lyrics.ovh */
  }
  const parts = title.split(/\s+-\s+/);
  if (parts.length >= 2) {
    try {
      const r = await fetchWithTimeout(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(parts[0].trim())}/${encodeURIComponent(parts.slice(1).join(' - ').trim())}`,
        8000,
      );
      if (r.ok) {
        const j = await r.json();
        if (j && j.lyrics) return { title: parts.slice(1).join(' - ').trim(), author: parts[0].trim(), url: null, content: j.lyrics };
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

// Resolve a raw NodeLink identifier (e.g. "scsearch:query", "ytsearch:query", a URL).
async function resolveIdentifier(bot, identifier) {
  const node = bot.shoukaku.getIdealNode();
  if (!node) {
    const e = new Error('NO_NODE');
    e.code = 'NO_NODE';
    throw e;
  }
  return node.rest.resolve(identifier);
}

// ---------- كشف حظر الـ IP بتاع يوتيوب — Detecting a YouTube IP block ----------
// لما يوتيوب يحظر الـ IP بتاع الـ VPS (429 / "سجّل دخول عشان تتأكد إنك مش
// بوت" / rate limit)، NodeLink بيرجّع loadType 'error' أو بيرمي استثناء
// والرسالة فيها واحدة من الكلمات دي. بنستخدمها عشان نعرف إن الفشل ده
// حظر IP — وساعتها بس بنقلب على ساوندكلاود أوتوماتيك.
// When YouTube blocks the VPS IP (429 / "sign in to confirm you're not
// a bot" / rate limit), NodeLink returns loadType 'error' or throws, and
// the message contains one of these hints. We use them to know the
// failure is an IP block — and ONLY then we auto-fall-back to SoundCloud.
const IP_BLOCK_HINTS = [
  '429',
  'too many requests',
  'rate limit',
  'ratelimit',
  'rate-limit',
  'sign in to confirm',
  "confirm you're not a bot",
  'not a bot',
  'ip banned',
  'ip blocked',
  'ip block',
  'blocked ip',
  'quota exceeded',
  'forbidden',
];

function isIpBlockText(text) {
  if (!text) return false;
  const s = String(text).toLowerCase();
  return IP_BLOCK_HINTS.some((h) => s.includes(h));
}

// هل نتيجة الـ resolve دي فشل بسبب حظر الـ IP؟
// Is this resolve result a failure caused by an IP block?
function isIpBlockResult(res) {
  if (!res || res.loadType !== 'error') return false;
  const d = res.data || {};
  return isIpBlockText(d.message) || isIpBlockText(d.cause) || isIpBlockText(d.severity);
}

// هل الاستثناء ده سببه حظر الـ IP؟
// Is this thrown error caused by an IP block?
function isIpBlockError(e) {
  if (!e) return false;
  return isIpBlockText(e.message) || isIpBlockText(e.code) || isIpBlockText(e.status);
}

// ---------- مساعدات الأوامر — Command helpers ----------
// لازم تكون فيه أغنية شغالة، وإلا رد بخطأ ورجّع false.
// There must be music playing, otherwise reply with an error and return false.
function needPlaying(ctx) {
  if (!ctx.music.alive || !ctx.music.current) {
    ctx.jerr('There is no music playing right now!');
    return false;
  }
  return true;
}

// اتأكد إن البوت متصل بروم صوتي (ادخل الروم لو مش موجود).
// Make sure the bot is connected to a voice channel (join it when needed).
async function ensureConnected(ctx) {
  const target = ctx.targetVoiceId;
  if (!target) {
    ctx.jerr('You must be in a voice channel to use that!');
    return false;
  }
  try {
    await ctx.music.connect(target);
    return true;
  } catch (e) {
    const map = { NO_NODE: 'The Lavalink server is not connected right now. Try again shortly.', NO_PERMS: "I don't have permission to join or speak in that channel.", CHANNEL_FULL: 'That voice channel is full.', INVALID_CHANNEL: 'That is not a valid voice channel.' };
    ctx.jerr(map[e.code] || 'Something went wrong. Please try again.');
    return false;
  }
}

// مدة بأسلوب LunaBot: 03:35 (الدقايق بصفر)، و 01:05:30 لو فيه ساعات.
// LunaBot-style duration: 03:35 (minutes zero-padded), 01:05:30 for hours.
function lunaDuration(ms) {
  const total = Math.floor((ms || 0) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${pad(h)}:${pad(m)}:${s}` : `${pad(m)}:${s}`;
}

// رد الـ play — سطر واحد (بيتلف لو طويل):
//   <:music1:1575256281277534308> **<العنوان الكامل>** added to the queue ( 04:20 ) - at position 1
// النص اللي المستخدم كتبه مش بيتعرض (العنوان الكامل من يوتيوب بس).
// النجوم جوه العنوان بتتهرب عشان متكسرش الـ bold.
// Play reply — ONE line (wraps naturally if long):
//   <:music1:1575256281277534308> **<full title>** added to the queue ( 04:20 ) - at position 1
// The user's typed text is NOT echoed (only the full YouTube title).
// Asterisks inside a title are escaped so they can't break the bold.
function lunaAddLine(item, position) {
  const dur = item.isStream ? 'LIVE' : lunaDuration(item.length);
  const title = truncate(item.title, 200).replace(/\*/g, '\\*');
  return `<:music1:1575256281277534308> **${title}** added to the queue ( ${dur} ) - at position ${position}`;
}

// رد لما يتكتب `شغل` من غير اسم أغنية أو لينك.
// النص ده بالظبط اللي المستخدم طلبه (إيموجي music2 في الأول).
// Reply when `play` / `شغل` is typed with no song name or URL.
// Exact text the user asked for (music2 emoji up front).
const PLAY_HELP = '<:music2:1575256198654201897> Play commands.\n**``/play [Song title]``: play the song \n``/play [URL]``: play the provided link, Playlist, Soundcloud, Spotify,yt**';

// ضيف تراكات للقائمة وابعت الرد المناسب.
// مهم: كل التراكات بتعدّي على makeItem الأول، لأن تراكات بحث/بلاي ليست
// NodeLink بتحط بياناتها جوه tr.info (title/length/uri/isStream)،
// فلو استخدمنا الـ raw object هيطلع item.title فاضي و Now Playing
// هتظهر بعنوان فاضي. makeItem بيفرد البيانات دي (وبيحتفظ بالـ encoded
// عشان التشغيل).
// Add tracks to the queue and send the right reply.
// ALWAYS normalize through makeItem: NodeLink search/playlist tracks
// carry their data nested under tr.info, so using the raw object leaves
// item.title/item.length undefined and Now Playing shows an empty title.
// makeItem flattens them (and keeps the encoded string for playback).
async function enqueueTracks(ctx, tracks, { front = false, playlistName = null, usedFallback = false } = {}) {
  const { music } = ctx;
  const space = config.maxQueue - music.queue.length;
  if (space <= 0) {
    ctx.jerr(`The queue is full (${config.maxQueue} tracks).`);
    return false;
  }
  const items = tracks.slice(0, space).map((tr) => music.makeItem(tr, ctx.author.id));
  if (!(await ensureConnected(ctx))) return false;
  const wasIdle = !music.current;
  music.add(items, front);
  // لو الأغنية جت من ساوندكلاود عشان يوتيوب محظور، وضّح ده في الرد
  // (سطر واحد فوق رد الـ play العادي، من غير ما يغيّر شكله).
  // لو يوتيوب مالقاش الأغنية أصلًا، وضّح إنها من ساوندكلاود عشان
  // مش موجودة على يوتيوب — مش عشان حظر.
  // When the track came from SoundCloud because YouTube was IP-blocked,
  // say so in one line above the normal play reply (without changing it).
  // When YouTube simply had no match, say it's from SoundCloud because
  // it wasn't found on YouTube — not because of a block.
  const fallbackNote = usedFallback === 'blocked'
    ? '⚠️ YouTube is blocked right now — played from SoundCloud instead.\n'
    : usedFallback === 'notfound'
      ? 'Not found on YouTube — played from SoundCloud instead.\n'
      : '';
  const fallbackTag = usedFallback === 'blocked'
    ? ' (from SoundCloud — YouTube is blocked right now)'
    : usedFallback === 'notfound'
      ? ' (from SoundCloud — not found on YouTube)'
      : '';
  if (playlistName) ctx.jok(`Added playlist **${escapeMd(truncate(playlistName, 80))}** (${items.length} tracks) to the queue.${fallbackTag}`);
  // رد الـ play (بيظهر مع كل تشغيل، سواء كان البوت فاضي أو مشغّل).
  // Play reply (shown on EVERY play, idle or busy).
  else if (items.length === 1) {
    const it = items[0];
    ctx.send({ content: `${fallbackNote}${lunaAddLine(it, front ? 1 : music.queue.length)}` });
  } else if (items.length > 1) {
    ctx.jok(`Added ${items.length} tracks to the queue.${fallbackTag}`);
  }
  if (wasIdle) await music.next();
  return true;
}

// شغّل نتيجة resolve جاهزة (المنطق المشترك بعد ما نجيب التراكات).
// Play an already-resolved result (shared logic after resolving tracks).
async function playResolved(ctx, res, front, usedFallback) {
  if (!res || res.loadType === 'empty') return ctx.jerr('No results found.');
  if (res.loadType === 'error') return ctx.jerr(`Failed to load the track${res.data?.message ? `: ${res.data.message}` : '.'}`);
  if (res.loadType === 'track') return enqueueTracks(ctx, [res.data], { front, usedFallback });
  if (res.loadType === 'search') {
    if (!res.data?.length) return ctx.jerr('No results found.');
    return enqueueTracks(ctx, [res.data[0]], { front, usedFallback });
  }
  if (res.loadType === 'playlist') {
    const tracks = res.data?.tracks || [];
    if (!tracks.length) return ctx.jerr('No results found.');
    return enqueueTracks(ctx, tracks, { front, playlistName: res.data.info?.name || 'Playlist', usedFallback });
  }
  return ctx.jerr('No results found.');
}

// شغّل بحث/لينك (أو بلاي ليست) — المنطق المشترك بين play و playnext.
// Play a search/link (or playlist) — the shared logic for play & playnext.
//
// البحث بالاسم: يوتيوب الأول دايمًا. لو يوتيوب رجّع إيرور حظر الـ IP
// (429 / "سجّل دخول..." / rate limit) أو رمى استثناء زيه → بنجرّب
// ساوندكلاود أوتوماتيك وبنشغّل منها. ولو يوتيوب مالقاش حاجة خالص،
// بنجرّب ساوندكلاود قبل ما نقول "No results found.".
// ولأننا بنجرّب يوتيوب الأول في كل مرة، أول ما الحظر يخلص البوت
// بيرجع يوتيوب لوحده من غير أي تدخل.
// Name search: YouTube first, every time. If YouTube returns an IP-block
// error (429 / "sign in..." / rate limit) or throws one → we retry
// SoundCloud automatically and play from there. If YouTube finds nothing
// at all, we try SoundCloud before giving up. Because YouTube is tried
// first on every play, the bot goes back to YouTube on its own as soon
// as the ban lifts — no toggle, no manual switch.
async function playQuery(ctx, query, front = false) {
  // اللينكات بتتحل على طول من غير fallback (لينك صريح من المستخدم).
  // URLs resolve directly, no fallback (explicit link from the user).
  if (isUrl(query)) {
    try {
      const res = await resolveIdentifier(ctx.bot, query);
      return playResolved(ctx, res, front, false);
    } catch (e) {
      if (e && e.code === 'NO_NODE') return ctx.jerr('The Lavalink server is not connected right now. Try again shortly.');
      throw e;
    }
  }

  const ytSearch = (config.defaultSearch || 'ytsearch').toLowerCase().startsWith('yt');
  let res;
  let usedFallback = false;
  try {
    res = await resolveIdentifier(ctx.bot, `${config.defaultSearch}:${query}`);
  } catch (e) {
    // الـ resolve نفسه رمى إيرور حظر IP → جرّب ساوندكلاود.
    // The resolve itself threw an IP-block error → try SoundCloud.
    if (ytSearch && isIpBlockError(e)) {
      res = await resolveIdentifier(ctx.bot, `scsearch:${query}`);
      usedFallback = 'blocked';
      return playResolved(ctx, res, front, usedFallback);
    }
    if (e && e.code === 'NO_NODE') return ctx.jerr('The Lavalink server is not connected right now. Try again shortly.');
    throw e;
  }

  // يوتيوب رجّع إيرور حظر IP → ساوندكلاود.
  // YouTube returned an IP-block error → SoundCloud.
  if (ytSearch && isIpBlockResult(res)) {
    res = await resolveIdentifier(ctx.bot, `scsearch:${query}`);
    usedFallback = 'blocked';
  } else if (res && res.loadType === 'empty') {
    // يوتيوب مالقاش حاجة — جرّب ساوندكلاود قبل ما تستسلم.
    // YouTube found nothing — try SoundCloud before giving up.
    const sc = await resolveIdentifier(ctx.bot, `scsearch:${query}`);
    if (sc && sc.loadType !== 'empty' && sc.loadType !== 'error') {
      res = sc;
      usedFallback = 'notfound';
    }
  }
  return playResolved(ctx, res, front, usedFallback);
}

// شغّل بلاي ليست محلية بالاسم (من فولدر Playlists).
// Play a local playlist by name (from the Playlists folder).
async function playPlaylistByName(ctx, name) {
  const items = await loadPlaylistItems(ctx.bot, name, ctx.author.id, ctx.music);
  if (!items) return ctx.jerr(`The playlist \`${name}\` does not exist! Use \`!playlists\` to see the available playlists.`);
  if (!items.length) return ctx.jerr(`The playlist \`${name}\` is empty!`);
  return enqueueTracks(ctx, items, { playlistName: name });
}

module.exports = {
  EMOJI,
  isUrl,
  playlistsDir,
  playlistFile,
  listPlaylists,
  loadPlaylistItems,
  resolveIdentifier,
  needPlaying,
  ensureConnected,
  lunaDuration,
  lunaAddLine,
  PLAY_HELP,
  enqueueTracks,
  playQuery,
  playResolved,
  playPlaylistByName,
  fetchLyrics,
  isIpBlockResult,
  isIpBlockError,
};
