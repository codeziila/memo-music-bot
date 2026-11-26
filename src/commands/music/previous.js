// ============================================================
//  previous.js — أمر "اللي قبله" (Previous command)
//  ------------------------------------------------------------
//  السابق / ارجع / رجوع / اللي قبله / previous
//  ------------------------------------------------------------
//  بيرجّع للأغنية اللي اتشغّلت قبل الحالية (من السجل).
//  لو مفيش أغنية قبلها، بيقول كده.
//  (الأمر ده من الطبقة القديمة، فبيرد بالعربي أو الإنجليزي
//  حسب لغة الأمر — عن طريق ctx.t.)
//  Plays the song that played before the current one (from history).
//  When there is no previous song, it says so.
//  (This command comes from the old layer, so it replies in Arabic or
//  English depending on the command's language — via ctx.t.)
// ============================================================
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'previous',
  aliases: ['prev', 'back'],
  ar: ['السابق', 'ارجع', 'رجوع', 'اللي قبله'],
  category: 'Music',
  args: '',
  help: 'plays the previous song',
  voice: true,

  async run(ctx) {
    if (!ctx.music.alive) return ctx.err(ctx.t.nothingPlaying);
    const prev = await ctx.music.previous();
    const title = (item, max = 80) => escapeMd(truncate(item.title, max));
    return prev ? ctx.ok(ctx.t.previousPlaying(title(prev))) : ctx.err(ctx.t.previousNone);
  },
};
