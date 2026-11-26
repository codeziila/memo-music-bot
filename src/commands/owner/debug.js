// ============================================================
//  debug.js — أمر معلومات التشخيص (Debug command)
//  ------------------------------------------------------------
//  ديبج / تصحيح / debug
//  ------------------------------------------------------------
//  بيعرض معلومات عن حالة البوت: مدة التشغيل، عدد السيرفرات،
//  عدد السيرفرات اللي فيها موسيقى شغالة، استهلاك الذاكرة،
//  نسخة Node.js، وحالة سيرفرات الصوت (NodeLink).
//  الرد إمبيديد سماوي بإيموجي 🔧.
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Shows diagnostics about the bot: uptime, server count, how many
//  servers have music playing, memory usage, Node.js version, and
//  the state of the audio nodes (NodeLink).
//  Reply is a sky-blue embed with the 🔧 emoji.
//  (Bot owner Mimo only — Owner only.)
// ============================================================
const embeds = require('../../utils/embeds');
const { formatDuration } = require('../../utils/format');

module.exports = {
  name: 'debug',
  aliases: [],
  ar: ['ديبج', 'تصحيح'],
  category: 'Owner',
  args: '',
  help: 'shows debug info',
  owner: true,

  async run(ctx) {
    const uptime = formatDuration(process.uptime() * 1000);
    const nodes = [...ctx.bot.shoukaku.nodes.values()].map((n) => `\`${n.name}\`: ${n.state}`).join('\n') || 'none';
    const guilds = ctx.bot.client.guilds.cache.size;
    const playing = [...ctx.bot.music.values()].filter((m) => m.current).length;
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    return ctx.send({ embeds: [embeds.info(`🔧 **Debug**\nUptime: ${uptime}\nGuilds: ${guilds}\nPlaying in: ${playing} guild(s)\nMemory: ${mem} MB\nNode: ${process.version}\nLavalink nodes:\n${nodes}`)] });
  },
};
