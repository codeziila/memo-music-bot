// ============================================================
//  prefix.js — أمر البريفكس (Prefix command)
//  ------------------------------------------------------------
//  بريفكس / البريفكس / البادئه / prefix
//  ------------------------------------------------------------
//  بيغيّر البريفكس بتاع البوت ده بس (في السيرفر ده بس).
//  مثال: "بريفكس !!" — من بعدها البوت ده بيرد على "!!شغل".
//  "بريفكس NONE" — بيرجّع البريفكس الافتراضي (البوت الأول "!"،
//  التاني "!2"، التالت "!3"...).
//  ملحوظة: الأوامر نفسها من غير بريفكس (عارية) — البريفكس ده
//  للتوافق مع ستايل JMusicBot القديم بس، ومش لازم تستخدمه.
//  (الأمر ده للمشرفين Manage Server بس.)
//  Changes THIS bot's prefix (in this server only).
//  Example: "بريفكس !!" — after that, this bot answers "!!شغل".
//  "بريفكس NONE" — resets to the default (Bot#1 "!", Bot#2 "!2"...).
//  Note: the commands themselves are prefix-less (bare) — this prefix
//  is only for compatibility with the old JMusicBot style; you don't
//  have to use it.
//  (Manage Server only.)
// ============================================================
const settings = require('../../store/settings');
const { defaultBotPrefix } = require('../../config');

module.exports = {
  name: 'prefix',
  aliases: ['setprefix'],
  ar: ['بريفكس', 'البريفكس', 'البادئه'],
  category: 'Admin',
  args: '<prefix|NONE>',
  help: 'sets a server-specific prefix',
  admin: true,

  async run(ctx) {
    const arg = ctx.args[0];
    if (!arg) return ctx.jerr('You must include a prefix! Example: `!prefix !!` or `!prefix NONE` to reset.');
    if (arg.toUpperCase() === 'NONE') {
      settings.setBotPrefix(ctx.guild.id, ctx.bot.id, null);
      const d = defaultBotPrefix(ctx.bot.index);
      return ctx.jok(`Prefix reset to \`${d}\` for this bot only. Other bots keep their own prefix.`);
    }
    if (arg.length > 5) return ctx.jerr('The prefix must be 5 characters or less!');
    settings.setBotPrefix(ctx.guild.id, ctx.bot.id, arg);
    return ctx.jok(`Prefix set to \`${arg}\` for **${ctx.bot.client.user.username}** only on *${ctx.guild.name}*. Other bots keep their own prefix. Use \`${arg}help\` from now on.`);
  },
};
