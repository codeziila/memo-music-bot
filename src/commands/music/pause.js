// ============================================================
//  pause.js — أمر الإيقاف المؤقت (Pause command)
//  ------------------------------------------------------------
//  انتظار / اوقف / ايقاف مؤقت / توقف / بوز / pause
//  ------------------------------------------------------------
//  بيوقف الأغنية مؤقتًا (من غير ما يمسح حاجة). عشان تكمّلها،
//  اكتب "كمل" أو "شغل" لوحدها. الأمر ده للمشرفين (DJ) بس.
//  Pauses the song (without clearing anything). To resume, type
//  "كمل" or a bare "شغل". DJs only.
// ============================================================
const { needPlaying } = require('../../music/playback');

module.exports = {
  name: 'pause',
  aliases: [],
  ar: ['انتظار', 'اوقف', 'ايقاف مؤقت', 'توقف', 'بوز'],
  category: 'DJ',
  args: '',
  help: 'pauses the current song',
  voice: true,
  dj: true,

  async run(ctx) {
    if (!needPlaying(ctx)) return;
    if (ctx.music.player.paused) return ctx.jerr('The player is already paused!');
    await ctx.music.player.setPaused(true);
    ctx.music.refreshNowPlaying();
    return ctx.jok('Paused the music.');
  },
};
