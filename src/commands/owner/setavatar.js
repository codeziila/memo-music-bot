// ============================================================
//  setavatar.js — أمر تغيير صورة البوت (Set Avatar command)
//  ------------------------------------------------------------
//  صوره / غير الصوره / setavatar
//  ------------------------------------------------------------
//  بيغيّر صورة البوت. يا إما تبعت صورة مرفقة مع الأمر،
//  يا إما تكتب لينك صورة (مثال: "صوره https://.../pic.png").
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Changes the bot's avatar. Either attach an image with the command,
//  or type an image URL (e.g. "صوره https://.../pic.png").
//  (Bot owner Mimo only — Owner only.)
// ============================================================
module.exports = {
  name: 'setavatar',
  aliases: [],
  ar: ['صوره', 'غير الصوره'],
  category: 'Owner',
  args: '<url>',
  help: 'sets the avatar of the bot',
  owner: true,

  async run(ctx) {
    const isUrl = (s) => /^https?:\/\//i.test(s);
    const url = ctx.message.attachments.first()?.url || ctx.args[0];
    if (!url || !isUrl(url)) return ctx.jerr('You must include an image URL or attach an image!');
    try {
      await ctx.bot.client.user.setAvatar(url);
      return ctx.jok('Avatar changed.');
    } catch (e) {
      return ctx.jerr(`Failed to change the avatar: ${e.message}`);
    }
  },
};
