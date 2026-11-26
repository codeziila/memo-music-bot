// ============================================================
//  settings.js — أمر الإعدادات (Settings command)
//  ------------------------------------------------------------
//  الاعدادات / اعدادات / ضبط / الضبط / settings
//  ------------------------------------------------------------
//  بيعرض إعدادات البوت في السيرفر ده: روم الكتابة، روم الصوت،
//  رول الـ DJ، البريفكس بتاع كل بوت، وضع التكرار، نوع القائمة،
//  الصوت، البلاي ليست الافتراضية، وعدد السيرفرات والاتصالات.
//  الرد نصي عادي (مش إمبيديد).
//  ملحوظة: الملف ده في فولدر admin/، لكن كاتيجوري "General" —
//  عشان يظهر في قسم "العامة" في المساعدة (مش في قسم الأدمن).
//  Shows this server's bot settings: text channel, voice channel,
//  DJ role, every bot's prefix, repeat mode, queue type, volume,
//  default playlist, and the server/connection counts.
//  Reply is plain text (not an embed).
//  Note: this file lives in admin/, but its category is "General" —
//  so it shows under "General" in the help (not under "Admin").
// ============================================================
const settings = require('../../store/settings');
const registry = require('../../registry');

module.exports = {
  name: 'settings',
  aliases: ['status'],
  ar: ['الاعدادات', 'اعدادات', 'ضبط', 'الضبط'],
  category: 'General',
  args: '',
  help: 'shows the bots settings',

  async run(ctx) {
    const s = settings.get(ctx.guild.id);
    const tchan = s.textChannelId && s.textChannelId !== '0' ? ctx.guild.channels.cache.get(s.textChannelId) : null;
    const vchan = s.voiceChannelId && s.voiceChannelId !== '0' ? ctx.guild.channels.cache.get(s.voiceChannelId) : null;
    const role = s.djRoleId && s.djRoleId !== '0' ? ctx.guild.roles.cache.get(s.djRoleId) : null;
    const repeatName = { off: 'Off', single: 'On' }[s.repeatMode] || 'Off';
    const prefixLines = registry.inGuild(ctx.guild.id)
      .map((b) => `\u2022 **${b.client.user?.username || `Bot#${b.index + 1}`}**: \`${settings.botPrefix(ctx.guild.id, b.id, b.index)}\``)
      .join('\n') || `\u2022 **${ctx.bot.client.user.username}**: \`${settings.botPrefix(ctx.guild.id, ctx.bot.id, ctx.bot.index)}\``;
    const text =
      `🎧 **${ctx.bot.client.user.username} settings:**\n` +
      `Text Channel: ${tchan ? `**#${tchan.name}**` : 'Any'}\n` +
      `Voice Channel: ${vchan ? `<#${vchan.id}>` : 'Any'}\n` +
      `DJ Role: ${role ? `**${role.name}**` : 'None'}\n` +
      `Custom Prefix (this bot): \`${settings.botPrefix(ctx.guild.id, ctx.bot.id, ctx.bot.index)}\`\n` +
      `All bots in this server:\n${prefixLines}\n` +
      `Repeat Mode: ${s.repeatMode === 'single' ? `**${repeatName}**` : repeatName}\n` +
      `Queue Type: ${s.queueType === 'fair' ? 'Fair' : '**Linear**'}\n` +
      `Volume: ${s.volume}%\n` +
      `Default Playlist: ${s.defaultPlaylist ? `**${s.defaultPlaylist}**` : 'None'}\n` +
      `${ctx.bot.client.guilds.cache.size} servers | ${ctx.bot.client.guilds.cache.filter((g) => g.members.me?.voice?.channelId).size} audio connections`;
    return ctx.send({ content: text });
  },
};
