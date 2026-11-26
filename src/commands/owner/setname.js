// ============================================================
//  setname.js — أمر تغيير اسم البوت (Set Name command)
//  ------------------------------------------------------------
//  اسم / غير الاسم / setname
//  ------------------------------------------------------------
//  بيغيّر اسم البوت اللي بينفذ الأمر (الاسم اللي بيظهر في ديسكورد).
//  مثال: "اسم موسيقى" — أو منشن البوت: "@Semo اسم موسيقى".
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Changes the name of the bot running the command (its Discord name).
//  Example: "اسم Music" — or mention the bot: "@Semo اسم Music".
//  (Bot owner Mimo only — Owner only.)
// ============================================================
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'setname',
  aliases: [],
  ar: ['اسم', 'غير الاسم'],
  category: 'Owner',
  args: '<name>',
  help: 'sets the name of the bot',
  owner: true,

  async run(ctx) {
    const name = ctx.args.join(' ').trim();
    if (!name) return ctx.jerr('You must include a name! Example: `!setname Music Bot`');
    try {
      await ctx.bot.client.user.setUsername(name.slice(0, 32));
      return ctx.jok(`Name changed to **${escapeMd(name.slice(0, 32))}**.`);
    } catch (e) {
      return ctx.jerr(`Failed to change the name: ${e.message}`);
    }
  },
};
