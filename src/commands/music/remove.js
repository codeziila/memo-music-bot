// ============================================================
//  remove.js — أمر حذف أغنية من القائمة (Remove command)
//  ------------------------------------------------------------
//  احذف / حذف / شيل / remove
//  ------------------------------------------------------------
//  بيمسح أغنية من القائمة برقمها (مثال: "احذف 3").
//  أو "احذف ALL" — بيمسح كل الأغاني اللي في القائمة (بس مش
//  الأغنية اللي شغالة دلوقتي).
//  Removes a song from the queue by its number (e.g. "احذف 3").
//  Or "احذف ALL" — removes every song in the queue (but not the
//  one playing now).
// ============================================================
const { toInt, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'remove',
  aliases: ['delete', 'rm'],
  ar: ['احذف', 'حذف', 'شيل'],
  category: 'Music',
  args: '<position|ALL>',
  help: 'removes a song from the queue',
  voice: true,

  async run(ctx) {
    const { music } = ctx;
    const arg = (ctx.args[0] || '').toUpperCase();
    if (arg === 'ALL') {
      const n = music.queue.length;
      if (!n) return ctx.jerr('The queue is empty.');
      music.queue = [];
      return ctx.jok(`Removed **${n}** tracks from the queue.`);
    }
    const n = toInt(ctx.args[0]);
    if (Number.isNaN(n)) return ctx.jerr('You must include a position! Example: `!remove 3`');
    if (n < 1 || n > music.queue.length) return ctx.jerr('That position is not in the queue!');
    const [item] = music.queue.splice(n - 1, 1);
    return ctx.jok(`Removed **${escapeMd(truncate(item.title, 80))}** from the queue.`);
  },
};
