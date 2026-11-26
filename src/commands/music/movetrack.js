// ============================================================
//  movetrack.js — أمر نقل أغنية (Move Track command)
//  ------------------------------------------------------------
//  نقل / حرك / movetrack (وكمان move و mv بالإنجليزي)
//  ------------------------------------------------------------
//  بينقل أغنية من مكان لمكان تاني في القائمة.
//  مثال: "نقل 5 1" — بياخد الأغنية رقم 5 ويحطها في أول القائمة.
//  (الأمر ده للمشرفين DJ بس.)
//  Moves a track from one position to another in the queue.
//  Example: "نقل 5 1" — takes track #5 and puts it at the front.
//  (DJs only.)
// ============================================================
const { toInt, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'movetrack',
  aliases: ['move', 'mv'],
  ar: ['نقل', 'حرك'],
  category: 'DJ',
  args: '<from> <to>',
  help: 'move a track in the current queue to a different position',
  voice: true,
  dj: true,

  async run(ctx) {
    const { music } = ctx;
    const from = toInt(ctx.args[0]);
    const to = toInt(ctx.args[1]);
    if (Number.isNaN(from) || Number.isNaN(to)) return ctx.jerr('You must include two positions! Example: `!movetrack 5 1`');
    const len = music.queue.length;
    if (from < 1 || from > len || to < 1 || to > len) return ctx.jerr('That position is not in the queue!');
    const [item] = music.queue.splice(from - 1, 1);
    music.queue.splice(to - 1, 0, item);
    return ctx.jok(`Moved **${escapeMd(truncate(item.title, 80))}** to position **${to}**.`);
  },
};
