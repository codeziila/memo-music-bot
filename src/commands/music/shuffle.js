// ============================================================
//  shuffle.js — أمر الخلط (Shuffle command)
//  ------------------------------------------------------------
//  خلط / عشوائي / لخبط / shuffle
//  ------------------------------------------------------------
//  بيلخبط ترتيب الأغاني في القائمة.
//  • لو نوع القائمة "fair" (عادل): بيلخبط أغانيك انت بس.
//  • لو نوع القائمة "linear" (عادي): بيلخبط كل القائمة.
//  (نوع القائمة بيتغيّر بأمر "نوع القائمه".)
//  Shuffles the queue.
//  • When the queue type is "fair": shuffles only YOUR songs.
//  • When the queue type is "linear": shuffles the whole queue.
//  (Change the queue type with the "نوع القائمه" command.)
// ============================================================
module.exports = {
  name: 'shuffle',
  aliases: ['mix'],
  ar: ['خلط', 'عشوائي', 'لخبط'],
  category: 'Music',
  args: '',
  help: 'shuffles songs you have added',
  voice: true,

  async run(ctx) {
    const { music } = ctx;
    if (music.queueType === 'fair') {
      const n = music.shuffleFair(ctx.author.id);
      if (n < 2) return ctx.jerr('You need at least 2 songs in the queue that you added to shuffle!');
      return ctx.jok(`Shuffled your **${n}** songs in the queue.`);
    }
    if (music.queue.length < 2) return ctx.jerr('You need at least 2 songs in the queue to shuffle!');
    music.shuffle();
    return ctx.jok(`Shuffled **${music.queue.length}** songs in the queue.`);
  },
};
