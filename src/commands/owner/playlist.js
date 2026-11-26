// ============================================================
//  playlist.js — أمر إدارة البلاي ليستات (Playlist Management command)
//  ------------------------------------------------------------
//  انشاء بلاي ليست / عمل بلاي ليست / playlist
//  ------------------------------------------------------------
//  بيدير البلاي ليستات المحفوظة (ملفات .txt في فولدر Playlists/):
//  • "playlist make <اسم>" — بيعمل بلاي ليست جديدة (فاضية).
//  • "playlist append <اسم> <أغنية أو لينك>" — بيضيف سطر للبلاي ليست.
//  • "playlist delete <اسم>" — بيمسح البلاي ليست.
//  • "playlist setdefault <اسم>" — بيخليها البلاي ليست الافتراضية.
//  • "playlist <اسم>" — بيشغّل البلاي ليست دي على طول.
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Manages the saved playlists (.txt files in the Playlists/ folder):
//  • "playlist make <name>" — creates a new (empty) playlist.
//  • "playlist append <name> <song or link>" — adds a line to it.
//  • "playlist delete <name>" — deletes the playlist.
//  • "playlist setdefault <name>" — makes it the default playlist.
//  • "playlist <name>" — plays that playlist right away.
//  (Bot owner Mimo only — Owner only.)
// ============================================================
const fs = require('fs');
const settings = require('../../store/settings');
const { playlistFile, playlistsDir, playPlaylistByName } = require('../../music/playback');
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'playlist',
  aliases: ['pl'],
  ar: ['انشاء بلاي ليست', 'عمل بلاي ليست'],
  category: 'Owner',
  args: '<name|append|delete|make|setdefault>',
  help: 'playlist management',
  owner: true,

  async run(ctx) {
    const sub = (ctx.args[0] || '').toLowerCase();
    const rest = ctx.args.slice(1);
    if (sub === 'make' || sub === 'create') {
      const name = rest.join(' ').trim();
      if (!name) return ctx.jerr('You must include a playlist name! Example: `!playlist make myplaylist`');
      const { safe, file } = playlistFile(name);
      if (fs.existsSync(file)) return ctx.jerr(`The playlist \`${safe}\` already exists!`);
      fs.mkdirSync(playlistsDir(), { recursive: true });
      fs.writeFileSync(file, '# One song per line: a URL or a search query\n');
      return ctx.jok(`Created the playlist **${safe}**. Add songs with \`!playlist append ${safe} <URL or song name>\`.`);
    }
    if (sub === 'delete' || sub === 'remove') {
      const name = rest.join(' ').trim();
      if (!name) return ctx.jerr('You must include a playlist name!');
      const { safe, file } = playlistFile(name);
      if (!fs.existsSync(file)) return ctx.jerr(`The playlist \`${safe}\` does not exist!`);
      fs.unlinkSync(file);
      return ctx.jok(`Deleted the playlist **${safe}**.`);
    }
    if (sub === 'append' || sub === 'add') {
      const name = rest[0];
      const query = rest.slice(1).join(' ').trim();
      if (!name || !query) return ctx.jerr('Usage: `!playlist append <name> <URL or song name>`');
      const { safe, file } = playlistFile(name);
      if (!fs.existsSync(file)) return ctx.jerr(`The playlist \`${safe}\` does not exist!`);
      fs.appendFileSync(file, `${query}\n`);
      return ctx.jok(`Added **${escapeMd(truncate(query, 80))}** to the playlist **${safe}**.`);
    }
    if (sub === 'setdefault') {
      const name = rest.join(' ').trim();
      if (!name) return ctx.jerr('You must include a playlist name!');
      if (!fs.existsSync(playlistFile(name).file)) return ctx.jerr(`The playlist \`${escapeMd(name)}\` does not exist!`);
      settings.update(ctx.guild.id, { defaultPlaylist: playlistFile(name).safe });
      return ctx.jok(`Default playlist set to **${escapeMd(playlistFile(name).safe)}**.`);
    }
    // "playlist <اسم>" — شغّلها على طول (من غير subcommand).
    // "playlist <name>" — play it right away (no subcommand).
    const name = ctx.args.join(' ').trim();
    if (!name) return ctx.jerr('Usage: `!playlist <name>` to play one, or `!playlist make|append|delete|setdefault <name>`.');
    return playPlaylistByName(ctx, name);
  },
};
