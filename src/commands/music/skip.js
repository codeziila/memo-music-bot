// ============================================================
//  skip.js — أمر التخطي (Skip command)
//  ------------------------------------------------------------
//  تخطي / سكب / عدي / التالي / اللي بعده / skip
//  ------------------------------------------------------------
//  بيعدّي الأغنية الحالية على طول — من غير تصويت، أي حد يقدر
//  يخطّي فورًا. الرد نصي عادي (مش إمبيديد): إيموجي music1 +
//  "Skipped <عنوان الأغنية> - @صاحب الطلب".
//  Skips the current song instantly — no voting, anyone can skip.
//  Reply is PLAIN TEXT (not an embed): music1 emoji +
//  "Skipped <song title> - @requester".
// ============================================================
const { needPlaying } = require('../../music/playback');
const { truncate } = require('../../utils/format');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  ar: ['تخطي', 'سكب', 'عدي', 'التالي', 'اللي بعده'],
  category: 'Music',
  args: '',
  help: 'skips the current song',
  voice: true,

  async run(ctx) {
    const { music } = ctx;
    if (!needPlaying(ctx)) return;
    const cur = music.current;
    const title = truncate(cur.title, 200).replace(/\*/g, '\\*');
    const who = cur.requesterId ? `<@${cur.requesterId}>` : `<@${ctx.author.id}>`;
    await music.skip();
    return ctx.send({ content: `<:music1:1575843561285361825> Skipped ${title} - ${who}` });
  },
};
