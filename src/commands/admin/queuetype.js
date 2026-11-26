// ============================================================
//  queuetype.js — أمر نوع القائمة (Queue Type command)
//  ------------------------------------------------------------
//  نوع القائمه / نوع القائمة / queuetype
//  ------------------------------------------------------------
//  بيغيّر نوع القائمة — وده بيأثر على أمر "خلط" (shuffle):
//  • "نوع القائمه fair" (عادل): كل واحد بيخلط أغانيه هو بس.
//  • "نوع القائمه linear" (عادي — الافتراضي): الخلط بيلخبط
//    كل القائمة.
//  "نوع القائمه" لوحدها: بيعرض النوع الحالي.
//  (الأمر ده للمشرفين Manage Server بس.)
//  Changes the queue type — this affects the "خلط" (shuffle) command:
//  • "نوع القائمه fair": each user shuffles only their own songs.
//  • "نوع القائمه linear" (default): shuffle mixes the whole queue.
//  Bare "نوع القائمه": shows the current type.
//  (Manage Server only.)
// ============================================================
const settings = require('../../store/settings');

module.exports = {
  name: 'queuetype',
  aliases: [],
  ar: ['نوع القائمه', 'نوع القائمة'],
  category: 'Admin',
  args: '[fair|linear]',
  help: 'changes the queue type',
  admin: true,

  async run(ctx) {
    const a = (ctx.args[0] || '').toLowerCase();
    if (!a) {
      const s = settings.get(ctx.guild.id);
      return ctx.jok(`The queue type is **${s.queueType === 'fair' ? 'Fair' : 'Linear'}**. Use \`!queuetype fair\` or \`!queuetype linear\`.`);
    }
    if (a !== 'fair' && a !== 'linear') return ctx.jerr('Queue type must be `fair` or `linear`!');
    settings.update(ctx.guild.id, { queueType: a });
    if (ctx.music) ctx.music.queueType = a;
    return ctx.jok(`Queue type set to **${a === 'fair' ? 'Fair' : 'Linear'}**.`);
  },
};
