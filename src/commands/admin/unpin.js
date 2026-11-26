// ============================================================
//  unpin.js — أمر فك التثبيت (Unpin command)
//  ------------------------------------------------------------
//  فك التثبيت / الغاء التثبيت / فك / unpin
//  ------------------------------------------------------------
//  بيلغي تثبيت البوت اللي في رومك — البوت هيرجع يطلع لوحده
//  بعد 60 ثانية من غير موسيقى (زي أي بوت مش متثبت).
//  (الأمر ده للمشرفين Manage Server بس.)
//  Unpins the bot in your channel — the bot goes back to leaving
//  by itself after 60 seconds of no music (like any unpinned bot).
//  (Manage Server only.)
// ============================================================
const pins = require('../../store/pins');

module.exports = {
  name: 'unpin',
  aliases: [],
  ar: ['فك التثبيت', 'الغاء التثبيت', 'فك'],
  category: 'Pin',
  args: '',
  help: 'unpins the bot from your channel',
  voice: true,
  admin: true,

  async run(ctx) {
    if (!pins.remove(ctx.bot.id, ctx.guild.id)) return ctx.err(ctx.t.notPinned);
    if (!ctx.music.current) ctx.music.scheduleIdleLeave();
    ctx.music.checkEmpty();
    return ctx.ok(ctx.t.unpinned);
  },
};
