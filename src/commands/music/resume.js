// ============================================================
//  resume.js — أمر الاستئناف (Resume command)
//  ------------------------------------------------------------
//  كمل / استئناف / استمرار / كمل التشغيل / resume
//  ------------------------------------------------------------
//  بيكمّل الأغنية المتوقفة مؤقتًا. (الأمر ده من الطبقة القديمة،
//  فبيرد بالعربي أو الإنجليزي حسب لغة الأمر — عن طريق ctx.t.)
//  Resumes a paused song. (This command comes from the old layer, so
//  it replies in Arabic or English depending on the command's language
//  — via ctx.t.)
// ============================================================
module.exports = {
  name: 'resume',
  aliases: ['unpause'],
  ar: ['كمل', 'استئناف', 'استمرار', 'كمل التشغيل'],
  category: 'Music',
  args: '',
  help: 'resumes a paused song',
  voice: true,

  async run(ctx) {
    if (!ctx.music.alive || !ctx.music.current) return ctx.err(ctx.t.nothingPlaying);
    if (!ctx.music.player.paused) return ctx.err(ctx.t.notPaused);
    await ctx.music.player.setPaused(false);
    ctx.music.refreshNowPlaying();
    return ctx.ok(ctx.t.resumed);
  },
};
