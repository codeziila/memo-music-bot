// ============================================================
//  setstatus.js — أمر تغيير الحالة (Set Status command)
//  ------------------------------------------------------------
//  الحاله / غير الحاله / setstatus
//  ------------------------------------------------------------
//  بيغيّر حالة البوت (النقطة الخضرا/الصفرا/الحمرا اللي جنب اسمه):
//  online (متصل) / idle (مشغول) / dnd (لا تزعج) / invisible (مخفي).
//  مثال: "الحاله dnd".
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Changes the bot's status (the green/yellow/red dot next to its name):
//  online / idle / dnd / invisible.
//  Example: "الحاله dnd".
//  (Bot owner Mimo only — Owner only.)
// ============================================================
module.exports = {
  name: 'setstatus',
  aliases: [],
  ar: ['الحاله', 'غير الحاله'],
  category: 'Owner',
  args: '<status>',
  help: 'sets the status the bot displays',
  owner: true,

  async run(ctx) {
    const s = (ctx.args[0] || '').toLowerCase();
    const map = { online: 'online', idle: 'idle', dnd: 'dnd', invisible: 'invisible' };
    if (!map[s]) return ctx.jerr('Status must be `online`, `idle`, `dnd` or `invisible`!');
    await ctx.bot.client.user.setStatus(map[s]);
    return ctx.jok(`Status set to **${s}**.`);
  },
};
