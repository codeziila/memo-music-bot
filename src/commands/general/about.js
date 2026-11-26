// ============================================================
//  about.js — أمر "عن البوت" (About command)
//  ------------------------------------------------------------
//  عن البوت / معلومات / حول / about
//  ------------------------------------------------------------
//  معلومات سريعة عن البوت: اسمه، صاحبه (Mimo)، والمحرك الصوتي
//  (NodeLink). رد نصي عادي (مش إمبيديد).
//  Quick info about the bot: its name, its owner (Mimo), and the
//  audio engine (NodeLink). A plain-text reply (not an embed).
// ============================================================
module.exports = {
  name: 'about',
  aliases: [],
  ar: ['عن البوت', 'معلومات', 'حول'],
  category: 'General',
  args: '',
  help: 'shows info about the bot',

  async run(ctx) {
    const name = ctx.bot.client.user.username;
    return ctx.send({ content: `🎶 **${name}** — a Discord music bot.\nOwner: Mimo (w2hm_)\nPowered by NodeLink.` });
  },
};
