// ============================================================
//  scsearch.js — أمر البحث في ساوندكلاود (SoundCloud search command)
//  ------------------------------------------------------------
//  ساوند / بحث ساوند / scsearch
//  ------------------------------------------------------------
//  بيدور في ساوندكلاود بالاسم ويشغّل أول نتيجة.
//  ملحوظة: بعض أغاني ساوندكلاود محمية بـ DRM ومفيش أي بوت يقدر
//  يشغّلها — البوت بيعدّيها ويشغّل اللي بعدها. جرّبها من يوتيوب.
//  Searches SoundCloud by name and plays the first result.
//  Note: some SoundCloud tracks are DRM-protected and no bot can play
//  them — the bot skips them. Try YouTube instead.
// ============================================================
const { resolveIdentifier, enqueueTracks } = require('../../music/playback');

module.exports = {
  name: 'scsearch',
  aliases: [],
  ar: ['ساوند', 'بحث ساوند'],
  category: 'Music',
  args: '<query>',
  help: 'searches Soundcloud for a provided query',
  voice: true,
  summon: true,

  async run(ctx) {
    const query = ctx.args.join(' ').trim();
    if (!query) return ctx.jerr('You must include a search query!');
    const res = await resolveIdentifier(ctx.bot, `scsearch:${query}`);
    const list = res && res.loadType === 'search' ? res.data : [];
    if (!list.length) return ctx.jerr('No results found.');
    return enqueueTracks(ctx, [list[0]]);
  },
};
