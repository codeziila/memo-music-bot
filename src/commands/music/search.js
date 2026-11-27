// ============================================================
//  search.js — أمر البحث في يوتيوب (YouTube search command)
//  ------------------------------------------------------------
//  بحث / ابحث / دور / search
//  ------------------------------------------------------------
//  بيدور في يوتيوب وبيعرض أول 10 نتايج في قائمة منسدلة (زي قائمة
//  السور في بوت القرآن) — بتختار الأغنية من القائمة والبوت بيشغّلها.
//  النتايج بتتحفظ في searchStore بمفتاح قصير، والقائمة بتشيل
//  المفتاح في الـ customId (music:search:<id>) — والاختيار نفسه
//  بيتعالج في buttons.js (handleSearchSelect).
//  Searches YouTube and shows the top 10 results in a dropdown
//  menu (like the Quran bot's surah menu) — pick a song from the
//  menu and the bot plays it. Results are kept in searchStore under
//  a short key, carried in the menu's customId (music:search:<id>);
//  the pick itself is handled in buttons.js (handleSearchSelect).
// ============================================================
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { resolveIdentifier, EMOJI } = require('../../music/playback');
const { saveSearch } = require('../../music/searchStore');
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
    const id = saveSearch(list, query, ctx.author.id);
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`music:search:${id}`)
      .setPlaceholder('🎵 اختر أغنية...')
      .addOptions(list.map((tr, i) => ({
        label: truncate(tr.info.title, 100),
        value: String(i),
        description: truncate(
          `${tr.info.isStream ? 'LIVE' : formatDuration(tr.info.length)}${tr.info.author ? ` — ${tr.info.author}` : ''}`,
          100,
        ),
      })));
    const row = new ActionRowBuilder().addComponents(menu);
    await ctx.send({
      content: `${EMOJI.searching} **Search results for: ${truncate(query, 200)}**\nاختار أغنية من القائمة 👇 (القائمة بتخلص بعد دقيقة)`,
      components: [row],
    });
  },
};
