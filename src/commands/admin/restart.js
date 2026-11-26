// ============================================================
//  restart.js — أمر الريستارت (Restart command)
//  ------------------------------------------------------------
//  ريستارت / إعادة تشغيل / اعادة تشغيل / restart
//  ------------------------------------------------------------
//  • "ريستارت الكل" / "restart all": بيرستّر كل البوتات
//    (بيرستّر العملية كلها — بيعيد تحميل الكود من الأول).
//  • "@Bot ريستارت": بيرستّر البوت اللي منشنته بس
//    (بيسجّل دخوله من جديد وبيرجع لرومه المثبت).
//  • "ريستارت" لوحدها (من غير all ومن غير منشن): بيرستّر بوت
//    الروم اللي انت فيه؛ ولو انت مش في روم، بيرد بشرح الاستخدام.
//  (الأمر ده للي عنده صلاحية Administrator بس — مش بس Manage Server.)
//  ملحوظة: الأمر ده بيشتغل من أي مكان، حتى لو انت مش في روم صوتي
//  (مستثنى من بوابة الصوت).
//  • "ريستارت الكل" / "restart all": restarts ALL bots
//    (restarts the whole process — reloads the code).
//  • "@Bot ريستارت": restarts just the mentioned bot
//    (re-logs it in and rejoins its pinned channel).
//  • Bare "ريستارت" (no all, no mention): restarts the bot in your
//    channel; when you're not in voice, it replies with usage.
//  (Administrator permission only — not just Manage Server.)
//  Note: this command works from anywhere, even with no voice channel
//  (exempt from the voice gate).
// ============================================================
const path = require('path');

module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  ar: ['ريستارت', 'إعادة تشغيل', 'اعادة تشغيل'],
  category: 'Admin',
  args: '[all]',
  help: 'restarts this bot, or all bots with "all" (Administrator only)',
  adminOnly: true,

  async run(ctx) {
    const arg = (ctx.args[0] || '').toLowerCase();
    const isAll = arg === 'all' || arg === 'الكل';
    if (isAll) {
      await ctx.jok('Restarting all bots...');
      const { spawn } = require('child_process');
      // جذر المشروع (3 مستويات فوق: src/commands/admin/ → الجذر).
      // Project root (3 levels up: src/commands/admin/ → root).
      const root = path.join(__dirname, '..', '..', '..');
      const child = spawn('sh', ['-c', `sleep 2; cd "${root}" && nohup npm start > bot.log 2>&1 &`], { detached: true, stdio: 'ignore' });
      child.unref();
      setTimeout(() => process.exit(0), 1000);
      return;
    }
    if (!ctx.mentionId && !ctx.userVoiceId) {
      return ctx.jerr('Use `restart all` to restart all bots, or mention the bot: `@Bot restart`.');
    }
    await ctx.jok('Restarting...');
    await ctx.bot.restartClient().catch((e) => ctx.bot.log('restart failed:', e.message));
  },
};
