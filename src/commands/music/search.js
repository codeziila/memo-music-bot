// ============================================================
//  search.js — أمر البحث في يوتيوب (YouTube search command)
//  ------------------------------------------------------------
//  بحث / ابحث / دور / search
//  ------------------------------------------------------------
//  بيدور في يوتيوب وبيعرض أول 10 نتايج، وبعدين بترد برقم الأغنية
//  اللي عايزها (1-10) خلال 30 ثانية — والبوت بيشغّلها.
//  Searches YouTube and shows the top 10 results; reply with the
//  number of the song you want (1-10) within 30 seconds and the bot
//  plays it.
// ============================================================
const { resolveIdentifier, enqueueTracks, EMOJI } = require('../../music/playback');
const { formatDuration, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'search',
  aliases: ['ytsearch', 'find'],
  ar: ['بحث', 'ابحث', 'دور'],
  category: 'Music',
  args: '<query>',
  help: 'searches Youtube for a provided query',
  voice: true,
  summon: true,

  async run(ctx) {
    const query = ctx.args.join(' ').trim();
    if (!query) return ctx.jerr('You must include a search query!');
    ctx.send({ content: `${EMOJI.searching} Searching for \`${escapeMd(truncate(query, 80))}\`...` });
    const res = await resolveIdentifier(ctx.bot, `ytsearch:${query}`);
    const list = res && res.loadType === 'search' ? res.data.slice(0, 10) : [];
    if (!list.length) return ctx.jerr('No results found.');
    const text = `${EMOJI.searching} **Search results for: ${truncate(query, 200)}**\n` +
      list.map((tr, i) => `\`${i + 1}.\` ${escapeMd(truncate(tr.info.title, 70))} \`${tr.info.isStream ? 'LIVE' : formatDuration(tr.info.length)}\``).join('\n') +
      `\nReply with the number of the song you want (1-10). You have 30 seconds.`;
    await ctx.send({ content: text });
    try {
      const collected = await ctx.channel.awaitMessages({
        filter: (m) => m.author.id === ctx.author.id && /^\d+$/.test(m.content.trim()),
        max: 1, time: 30000, errors: ['time'],
      });
      const n = Number(collected.first().content.trim());
      if (n < 1 || n > list.length) return ctx.jerr('That is not a valid number!');
      return enqueueTracks(ctx, [list[n - 1]]);
    } catch {
      return ctx.jwarn('Search timed out — no song was selected.');
    }
  },
};
