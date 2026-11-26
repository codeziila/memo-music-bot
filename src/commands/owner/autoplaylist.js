// ============================================================
//  autoplaylist.js — أمر البلاي ليست الافتراضية (Auto Playlist command)
//  ------------------------------------------------------------
//  بلاي ليست تلقائي / قائمه تلقائيه / autoplaylist
//  ------------------------------------------------------------
//  بيحدد بلاي ليست افتراضية للسيرفر: لما القائمة تخلص، البوت
//  يشغّل البلاي ليست دي لوحده (من غير ما حد يطلبها).
//  • "بلاي ليست تلقائي <اسم>" — بيظبطها على بلاي ليست موجودة.
//  • "بلاي ليست تلقائي NONE" — بيلغيها.
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Sets a default playlist for the server: when the queue ends, the
//  bot plays this playlist by itself (without anyone asking).
//  • "بلاي ليست تلقائي <name>" — sets it to an existing playlist.
//  • "بلاي ليست تلقائي NONE" — clears it.
//  (Bot owner Mimo only — Owner only.)
// ============================================================
const fs = require('fs');
const settings = require('../../store/settings');
const { playlistFile } = require('../../music/playback');
const { escapeMd } = require('../../utils/format');

module.exports = {
  name: 'autoplaylist',
  aliases: [],
  ar: ['بلاي ليست تلقائي', 'قائمه تلقائيه'],
  category: 'Owner',
  args: '<name|NONE>',
  help: 'sets the default playlist for the server',
  owner: true,

  async run(ctx) {
    const arg = ctx.args.join(' ').trim();
    if (!arg) return ctx.jerr('You must include a playlist name! Example: `!autoplaylist myplaylist` or `!autoplaylist NONE`');
    if (arg.toUpperCase() === 'NONE') {
      settings.update(ctx.guild.id, { defaultPlaylist: null });
      return ctx.jok('Default playlist cleared.');
    }
    if (!fs.existsSync(playlistFile(arg).file)) return ctx.jerr(`The playlist \`${escapeMd(arg)}\` does not exist! Use \`!playlist make ${escapeMd(arg)}\` first.`);
    settings.update(ctx.guild.id, { defaultPlaylist: playlistFile(arg).safe });
    return ctx.jok(`Default playlist set to **${escapeMd(playlistFile(arg).safe)}**. It will play when the queue ends.`);
  },
};
