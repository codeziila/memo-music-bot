// ============================================================
//  forceremove.js — أمر الحذف الإجباري (Force Remove command)
//  ------------------------------------------------------------
//  حذف اجباري / forceremove
//  ------------------------------------------------------------
//  بيمسح كل أغاني مستخدم معيّن من القائمة (للمشرفين DJ بس).
//  مثال: "حذف اجباري @فلان" — بيمسح كل الأغاني اللي هو ضافها.
//  Removes every song by a specific user from the queue (DJs only).
//  Example: "حذف اجباري @someone" — removes all songs they added.
// ============================================================
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'forceremove',
  aliases: ['forcedelete', 'modremove', 'moddelete', 'modelete'],
  ar: ['حذف اجباري', 'حذف إجباري'],
  category: 'DJ',
  args: '<user>',
  help: 'removes all entries by a user from the queue',
  voice: true,
  dj: true,

  async run(ctx) {
    const { music } = ctx;
    const arg = ctx.args[0];
    const user = ctx.message.mentions.users.first() || (arg ? await ctx.bot.client.users.fetch(arg.replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!user) return ctx.jerr('You must mention a user! Example: `!forceremove @someone`');
    const before = music.queue.length;
    music.queue = music.queue.filter((it) => it.requesterId !== user.id);
    const removed = before - music.queue.length;
    if (!removed) return ctx.jwarn(`**${escapeMd(user.username)}** has no songs in the queue.`);
    return ctx.jok(`Removed **${removed}** ${removed === 1 ? 'entry' : 'entries'} by **${escapeMd(user.username)}** from the queue.`);
  },
};
