// ============================================================
//  replay.js — أمر إعادة التشغيل (Replay command)
//  ------------------------------------------------------------
//  اعاده / عيد / من الاول / replay
//  ------------------------------------------------------------
//  بيشغّل الأغنية الحالية من الأول (بيرجّعها لوقت 0).
//  (الأمر ده من الطبقة القديمة، فبيرد بالعربي أو الإنجليزي
//  حسب لغة الأمر — عن طريق ctx.t.)
//  Restarts the current song from the beginning (seeks to 0).
//  (This command comes from the old layer, so it replies in Arabic or
//  English depending on the command's language — via ctx.t.)
// ============================================================
module.exports = {
  name: 'replay',
  aliases: [],
  ar: ['اعاده', 'عيد', 'من الاول'],
  category: 'Music',
  args: '',
  help: 'replays the current song',
  voice: true,

  async run(ctx) {
    if (!ctx.music.alive || !ctx.music.current) return ctx.err(ctx.t.nothingPlaying);
    if (!ctx.music.current.isSeekable) return ctx.err(ctx.t.notSeekable);
    await ctx.music.player.seekTo(0);
    return ctx.ok(ctx.t.replayed);
  },
};
