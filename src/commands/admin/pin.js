// ============================================================
//  pin.js — أمر التثبيت (Pin command)
//  ------------------------------------------------------------
//  ثبت / تثبيت / pin
//  ------------------------------------------------------------
//  بيثبّت البوت في رومك الصوتي 24/7 — يعني البوت هيفضل قاعد
//  في الروم ده على طول، حتى بعد ما البوت يرستّر أو السيرفر
//  يرستّر. ممكن تكتب اسم روم تاني عشان تثبّته فيه
//  (مثال: "ثبت #موسيقى").
//  (الأمر ده للمشرفين Manage Server بس.)
//  Pins the bot to your voice channel 24/7 — the bot stays in that
//  channel forever, even after the bot or the server restarts.
//  You can name another channel to pin it there
//  (e.g. "ثبت #music").
//  (Manage Server only.)
//  ملحوظة: الأمر ده مستثنى من قاعدة "البوت المثبت" (canMove) —
//  هو نفسه اللي بينقل البوت لرومه الجديد.
//  Note: this command is exempt from the pinned-bot rule (canMove) —
//  it is the one that moves the bot to its new channel.
// ============================================================
const pins = require('../../store/pins');
const registry = require('../../registry');

module.exports = {
  name: 'pin',
  aliases: ['247', 'stay'],
  ar: ['ثبت', 'تثبيت'],
  category: 'Pin',
  args: '[channel]',
  help: 'pins the bot to your channel 24/7',
  voice: true,
  summon: true,
  channelArg: true,
  canMove: true,
  admin: true,

  async run(ctx) {
    const { t, bot, guild } = ctx;
    const target = ctx.targetVoiceId;
    const other = registry
      .inGuild(guild.id)
      .find((b) => b !== bot && pins.get(b.id, guild.id)?.channelId === target);
    if (other) return ctx.err(t.channelTaken(other.id));
    await ctx.music.connect(target);
    pins.set(bot.id, guild.id, { channelId: target, textChannelId: ctx.channel?.id || null });
    ctx.music.clearIdle();
    return ctx.ok(t.pinned(target));
  },
};
