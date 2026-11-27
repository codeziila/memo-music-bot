// ============================================================
//  forceskip.js — أمر التخطي الإجباري (Force Skip command)
//  ------------------------------------------------------------
//  تخطي اجباري / forceskip
//  ------------------------------------------------------------
//  زي "تخطي" بالظبط (بيعدّي الأغنية الحالية فورًا)، بس للمشرفين
//  (DJ) — والرد بيكون إمبيديد سماوي (مش نص عادي زي تخطي).
//  Exactly like "تخطي" (skips the current song instantly), but for
//  DJs — and the reply is a sky-blue EMBED (unlike skip's plain text).
// ============================================================
const { needPlaying } = require('../../music/playback');
const { truncate } = require('../../utils/format');
const embeds = require('../../utils/embeds');

module.exports = {
  name: 'forceskip',
  aliases: ['modskip'],
  ar: ['تخطي اجباري', 'تخطي إجباري'],
  category: 'DJ',
  args: '',
  help: 'skips the current song',
  voice: true,
  dj: true,

  async run(ctx) {
    if (!needPlaying(ctx)) return;
    const cur = ctx.music.current;
    const title = truncate(cur.title, 200).replace(/\*/g, '\\*');
    const who = cur.requesterId ? `<@${cur.requesterId}>` : `<@${ctx.author.id}>`;
    await ctx.music.skip();
    return ctx.send({ embeds: [embeds.info(`<:music1:1575843561285361825> Skipped ${title} - ${who}`)] });
  },
};
