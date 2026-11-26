// ============================================================
//  shutdown.js — أمر إطفاء البوت (Shutdown command)
//  ------------------------------------------------------------
//  اطفاء البوت / ايقاف البوت / اطفاء / shutdown
//  ------------------------------------------------------------
//  بيطفي البوت بأمان (بيوقف العملية كلها). عشان تشغّله تاني،
//  لازم تشغّله من الـ VPS (npm start) — مفيش أمر من ديسكورد
//  بيشغّله بعد ما يطفي.
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Shuts the bot down safely (stops the whole process). To start it
//  again, you must start it from the VPS (npm start) — no Discord
//  command can bring it back after it stops.
//  (Bot owner Mimo only — Owner only.)
// ============================================================
module.exports = {
  name: 'shutdown',
  aliases: [],
  ar: ['اطفاء البوت', 'ايقاف البوت', 'اطفاء'],
  category: 'Owner',
  args: '',
  help: 'safely shuts down',
  owner: true,

  async run(ctx) {
    await ctx.jok('Shutting down...');
    setTimeout(() => process.exit(0), 1000);
  },
};
