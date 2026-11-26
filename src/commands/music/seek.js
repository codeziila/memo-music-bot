// ============================================================
//  seek.js — أمر التقديم (Seek command)
//  ------------------------------------------------------------
//  تقديم / قدم / روح / seek
//  ------------------------------------------------------------
//  بينط لوقت معيّن جوه الأغنية اللي شغالة دلوقتي.
//  • "قدم 1:30" — بيروح للدقيقة 1:30.
//  • "قدم +10" — بيقدّم 10 ثواني. "قدم -10" — بيرجّع 10 ثواني.
//  (الأغاني اللي مينفعش يتقدّم فيها — زي البث المباشر — بيطلع خطأ.)
//  Jumps to a time inside the song playing now.
//  • "قدم 1:30" — goes to 1:30.
//  • "قدم +10" — forward 10 seconds. "قدم -10" — back 10 seconds.
//  (Tracks that can't be seeked — like live streams — error out.)
// ============================================================
const { formatDuration, parseTime } = require('../../utils/format');
const { needPlaying } = require('../../music/playback');

module.exports = {
  name: 'seek',
  aliases: [],
  ar: ['تقديم', 'قدم', 'روح'],
  category: 'Music',
  args: '[+ | -] <HH:MM:SS | MM:SS | SS>',
  help: 'seeks the current song',
  voice: true,

  async run(ctx) {
    const { music } = ctx;
    if (!needPlaying(ctx)) return;
    if (!music.current.isSeekable) return ctx.jerr('This track cannot be seeked!');
    const raw = ctx.args[0];
    if (!raw) return ctx.jerr('You must include a time! Example: `!seek 1:30`');
    let ms;
    const rel = raw.match(/^([+-])(.+)$/);
    if (rel) {
      const d = parseTime(rel[2]);
      if (d == null) return ctx.jerr('That is not a valid time!');
      ms = (music.player.position || 0) + (rel[1] === '+' ? d : -d);
    } else {
      ms = parseTime(raw);
      if (ms == null) return ctx.jerr('That is not a valid time!');
    }
    ms = Math.max(0, Math.min(ms, music.current.length - 1000));
    await music.player.seekTo(ms);
    return ctx.jok(`Seeked to **${formatDuration(ms)}**.`);
  },
};
