// ============================================================
//  playnext.js — أمر "شغّل بعدها" (Play Next command)
//  ------------------------------------------------------------
//  شغل بعدها / بعدها / playnext
//  ------------------------------------------------------------
//  زي "شغل" بالظبط، بس الأغنية بتتحط في أول القائمة — يعني
//  هتشتغل بعد الأغنية الحالية على طول (مش في آخر الطابور).
//  Like "شغل", but the song goes to the FRONT of the queue — so it
//  plays right after the current song (not at the end).
// ============================================================
const { playQuery } = require('../../music/playback');

module.exports = {
  name: 'playnext',
  aliases: ['pn', 'playtop'],
  ar: ['شغل بعدها', 'بعدها'],
  category: 'DJ',
  args: '<title|URL>',
  help: 'plays a single song next',
  voice: true,
  summon: true,
  dj: true,

  async run(ctx) {
    const query = ctx.args.join(' ').trim();
    if (!query) return ctx.jerr('You must include a song name or URL!');
    return playQuery(ctx, query, true);
  },
};
