// ============================================================
//  play.js — أمر التشغيل (Play command)
//  ------------------------------------------------------------
//  شغل / ش / تشغيل / شغلي / play
//  ------------------------------------------------------------
//  أهم أمر في البوت: بيشغّل أغنية باسمها (بحث يوتيوب) أو بلينك
//  (يوتيوب / سبوتيفاي / ساوندكلاود / بلاي ليست).
//  • لو كتبت اسم أغنية: بيدور عليها في يوتيوب ويشغّل أول نتيجة.
//  • لو كتبت لينك: بيشغّله على طول (حتى لو بلاي ليست كاملة).
//  • لو كتبت "شغل" لوحدها والأغنية متوقفة مؤقتًا: بيكمّلها.
//  • لو كتبت "شغل" لوحدها ومفيش حاجة: بيبعت شرح مختصر للأمر.
//  • "شغل بلاي ليست <اسم>" — بيشغّل بلاي ليست محفوظة من فولدر Playlists.
//  The main command: plays a song by name (YouTube search) or by link
//  (YouTube / Spotify / SoundCloud / playlist).
//  • A song name: searches YouTube and plays the first result.
//  • A link: plays it directly (even a full playlist).
//  • Bare "شغل" while paused: resumes the song.
//  • Bare "شغل" with nothing: shows a short usage help.
//  • "شغل بلاي ليست <name>" — plays a saved playlist from Playlists/.
//  ------------------------------------------------------------
//  الرد: سطر نصي عادي (مش إمبيديد) — إيموجي music1 + **العنوان الكامل**
//  (من يوتيوب، مش النص اللي كتبته) + المدة + رقمها في القائمة.
//  Reply: a plain-text line (NOT an embed) — music1 emoji + **the full
//  YouTube title** (not what you typed) + duration + queue position.
// ============================================================
const { playQuery, playPlaylistByName, PLAY_HELP } = require('../../music/playback');

module.exports = {
  name: 'play',
  aliases: ['p'],
  ar: ['شغل', 'ش', 'تشغيل', 'شغلي'],
  category: 'Music',
  args: '<title|URL|subcommand>',
  help: 'plays the provided song',
  voice: true,
  summon: true,

  async run(ctx) {
    const query = ctx.args.join(' ').trim();
    if (!query) {
      // "شغل" لوحدها والأغنية متوقفة مؤقتًا → كمّلها.
      // Bare "شغل" while paused → resume it.
      if (ctx.music.alive && ctx.music.player?.paused) {
        await ctx.music.player.setPaused(false);
        ctx.music.refreshNowPlaying();
        return ctx.jok('Resumed the music.');
      }
      return ctx.send({ content: PLAY_HELP });
    }
    if (/^playlist\s+/i.test(query)) return playPlaylistByName(ctx, query.replace(/^playlist\s+/i, '').trim());
    return playQuery(ctx, query, false);
  },
};
