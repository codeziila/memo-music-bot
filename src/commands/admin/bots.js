// ============================================================
//  bots.js — أمر حالة البوتات (Bots Status command)
//  ------------------------------------------------------------
//  البوتات / بوتات / bots
//  ------------------------------------------------------------
//  بيعرض حالة كل بوت في السيرفر: في أنهو روم، وبيشغّل إيه
//  دلوقتي (ولا فاضي)، ومتثبت في أنهو روم (لو متثبت).
//  الرد إمبيديد سماوي بإيموجي 🤖.
//  ملحوظة: الأمر ده لازم يتكتب لوحده (من غير كلام بعده).
//  Shows the status of every bot in the server: which channel each
//  is in, what it is playing now (or idle), and which channel it is
//  pinned to (if pinned).
//  Reply is a sky-blue embed with the 🤖 emoji.
//  Note: this command must be typed alone (with nothing after it).
// ============================================================
const pins = require('../../store/pins');
const registry = require('../../registry');
const embeds = require('../../utils/embeds');

module.exports = {
  name: 'bots',
  aliases: [],
  ar: ['البوتات', 'بوتات'],
  category: 'Pin',
  args: '',
  help: 'status of every bot in the server',
  strict: true,

  async run(ctx) {
    const { t } = ctx;
    const lines = registry.inGuild(ctx.guild.id).map((b, i) => {
      const vc = b.voiceChannelId(ctx.guild.id);
      const m = b.getMusic(ctx.guild.id, false);
      const pin = pins.get(b.id, ctx.guild.id);
      let s = vc ? (m && m.current ? t.botPlaying(vc) : t.botIdle(vc)) : t.botFree;
      if (pin) s += ` • ${t.botPinnedTag(pin.channelId)}`;
      return `\`${i + 1}.\` <@${b.id}> — ${s}`;
    });
    return ctx.send({ embeds: [embeds.info(`🤖 **${t.botsTitle}**\n${lines.join('\n').slice(0, 4096) || '-'}`)] });
  },
};
