// ============================================================
//  pinall.js — أمر تثبيت الكل (Pin All command)
//  ------------------------------------------------------------
//  ثبت الكل / تثبيت الكل / pinall
//  ------------------------------------------------------------
//  بيثبّت كل البوتات اللي في السيرفر — كل بوت في الروم اللي
//  هو فيه دلوقتي (24/7).
//  (الأمر ده للمشرفين Manage Server بس.)
//  ملحوظة: الأمر ده لازم يتكتب لوحده (من غير كلام بعده) —
//  عشان البوت ميردّش على كلام عادي يبدأ بـ "ثبت الكل".
//  Pins every bot in the server — each bot in the channel it is
//  in right now (24/7).
//  (Manage Server only.)
//  Note: this command must be typed alone (with nothing after it) —
//  so the bot doesn't answer normal chat that starts with "ثبت الكل".
// ============================================================
const pins = require('../../store/pins');
const registry = require('../../registry');

module.exports = {
  name: 'pinall',
  aliases: ['247all'],
  ar: ['ثبت الكل', 'تثبيت الكل'],
  category: 'Pin',
  args: '',
  help: 'pins all bots to the channel they are in now',
  admin: true,
  strict: true,

  async run(ctx) {
    const lines = [];
    for (const b of registry.inGuild(ctx.guild.id)) {
      const vc = b.voiceChannelId(ctx.guild.id);
      if (!vc) continue;
      pins.set(b.id, ctx.guild.id, { channelId: vc, textChannelId: ctx.channel?.id || null });
      const m = b.getMusic(ctx.guild.id, false);
      if (m) m.clearIdle();
      lines.push(`<@${b.id}> ➜ <#${vc}>`);
    }
    return lines.length ? ctx.ok(ctx.t.pinAll(lines.join('\n'))) : ctx.err(ctx.t.pinAllNone);
  },
};
