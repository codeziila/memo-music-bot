// ============================================================
//  lyrics.js — أمر كلمات الأغنية (Lyrics command)
//  ------------------------------------------------------------
//  كلمات / كلمات الاغنيه / lyrics
//  ------------------------------------------------------------
//  بيعرض كلمات الأغنية اللي شغالة دلوقتي (أو أغنية تكتب اسمها).
//  بيدور في lrclib الأول (مجاني، من غير API key)، وبعدين في
//  lyrics.ovh لو ملقاش. الكلمات الطويلة بتتقسّم على رسايل.
//  Shows the lyrics of the song playing now (or a song you name).
//  Searches lrclib first (free, no API key), then lyrics.ovh.
//  Long lyrics are split across several messages.
// ============================================================
const { fetchLyrics } = require('../../music/playback');
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'lyrics',
  aliases: [],
  ar: ['كلمات', 'كلمات الاغنيه', 'كلمات الاغنية'],
  category: 'Music',
  args: '[song name]',
  help: 'shows the lyrics of a song',
  voice: false,

  async run(ctx) {
    const title = ctx.args.join(' ').trim() || ctx.music.current?.title;
    if (!title) return ctx.jerr('There must be music playing to use that!');
    await ctx.channel.sendTyping().catch(() => {});
    const lyrics = await fetchLyrics(title);
    if (!lyrics) return ctx.jerr(`Lyrics for \`${escapeMd(truncate(title, 80))}\` could not be found!${ctx.args.length ? '' : ' Try entering the song name manually (`!lyrics [song name]`)'}`);
    const head = `**${truncate(lyrics.title, 250)}**${lyrics.author ? ` — ${lyrics.author}` : ''}${lyrics.url ? `\n${lyrics.url}` : ''}`;
    if (lyrics.content.length > 15000) {
      ctx.jwarn(`Lyrics for \`${escapeMd(truncate(title, 60))}\` found but likely not correct: ${lyrics.url || ''}`);
      return;
    }
    let content = lyrics.content.trim();
    let first = true;
    while (content.length > 2000) {
      let idx = content.lastIndexOf('\n\n', 2000);
      if (idx === -1) idx = content.lastIndexOf('\n', 2000);
      if (idx === -1) idx = content.lastIndexOf(' ', 2000);
      if (idx === -1) idx = 2000;
      await ctx.send({ content: (first ? head + '\n\n' : '') + content.slice(0, idx).trim() });
      content = content.slice(idx).trim();
      first = false;
    }
    return ctx.send({ content: (first ? head + '\n\n' : '') + content });
  },
};
