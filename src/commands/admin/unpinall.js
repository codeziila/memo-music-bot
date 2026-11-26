// ============================================================
//  unpinall.js — أمر فك تثبيت الكل (Unpin All command)
//  ------------------------------------------------------------
//  فك الكل / الغاء تثبيت الكل / unpinall
//  ------------------------------------------------------------
//  بيلغي تثبيت كل البوتات في السيرفر — كل البوتات هترجع تطلع
//  لوحدها بعد 60 ثانية من غير موسيقى.
//  (الأمر ده للمشرفين Manage Server بس.)
//  ملحوظة: الأمر ده لازم يتكتب لوحده (من غير كلام بعده).
//  Unpins every bot in the server — all bots go back to leaving
//  by themselves after 60 seconds of no music.
//  (Manage Server only.)
//  Note: this command must be typed alone (with nothing after it).
// ============================================================
const pins = require('../../store/pins');
const registry = require('../../registry');

module.exports = {
  name: 'unpinall',
  aliases: [],
  ar: ['فك الكل', 'الغاء تثبيت الكل'],
  category: 'Pin',
  args: '',
  help: 'unpins all bots',
  admin: true,
  strict: true,

  async run(ctx) {
    let n = 0;
    for (const b of registry.inGuild(ctx.guild.id)) {
      if (pins.remove(b.id, ctx.guild.id)) {
        n++;
        const m = b.getMusic(ctx.guild.id, false);
        if (m) {
          if (!m.current) m.scheduleIdleLeave();
          m.checkEmpty();
        }
      }
    }
    return ctx.ok(ctx.t.unpinAll(n));
  },
};
