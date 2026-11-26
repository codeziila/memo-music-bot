// ============================================================
//  skipto.js — أمر النط لأغنية (Skip To command)
//  ------------------------------------------------------------
//  انتقل / اقفز / نط / skipto
//  ------------------------------------------------------------
//  بينط لأغنية معيّنة في القائمة برقمها (مثال: "انتقل 4") —
//  بيعدّي كل الأغاني اللي قبلها ويشغّل دي على طول.
//  (الأمر ده للمشرفين DJ بس.)
//  Jumps to a specific song in the queue by its number (e.g.
//  "انتقل 4") — skips everything before it and plays it right away.
//  (DJs only.)
// ============================================================
const { toInt, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'skipto',
  aliases: ['jumpto', 'jump'],
  ar: ['انتقل', 'اقفز', 'نط'],
  category: 'DJ',
  args: '<position>',
  help: 'skips to the specified song',
  voice: true,
  dj: true,

  async run(ctx) {
    const { music } = ctx;
    if (!music.alive) return ctx.jerr('There is no music playing right now!');
    const n = toInt(ctx.args[0]);
    if (Number.isNaN(n)) return ctx.jerr('You must include a position! Example: `!skipto 4`');
    if (n < 1 || n > music.queue.length) return ctx.jerr('That position is not in the queue!');
    const target = music.queue[n - 1];
    await music.skipTo(n);
    return ctx.jok(`Skipped to **${escapeMd(truncate(target.title, 80))}**.`);
  },
};
