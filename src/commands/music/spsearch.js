// ============================================================
//  spsearch.js — أمر البحث في سبوتيفاي (Spotify search command)
//  ------------------------------------------------------------
//  سبوتيفاي / بحث سبوتيفاي / سبوتفاي / spsearch
//  ------------------------------------------------------------
//  بيدور في سبوتيفاي بالاسم ويشغّل أول نتيجة. (لينكات سبوتيفاي
//  بتشتغل على طول من أمر "شغل" من غير ما تحتاج الأمر ده.)
//  Searches Spotify by name and plays the first result. (Spotify
//  links work directly with "شغل" — you don't need this command
//  for links.)
// ============================================================
const { resolveIdentifier, enqueueTracks } = require('../../music/playback');

module.exports = {
  name: 'spsearch',
  aliases: [],
  ar: ['سبوتيفاي', 'بحث سبوتيفاي', 'سبوتفاي'],
  category: 'Music',
  args: '<query>',
  help: 'searches Spotify for a provided query',
  voice: true,
  summon: true,

  async run(ctx) {
    const query = ctx.args.join(' ').trim();
    if (!query) return ctx.jerr('You must include a search query!');
    const res = await resolveIdentifier(ctx.bot, `spsearch:${query}`);
    const list = res && res.loadType === 'search' ? res.data : [];
    if (!list.length) return ctx.jerr('No results found.');
    return enqueueTracks(ctx, [list[0]]);
  },
};
