// ============================================================
//  playlists.js — أمر عرض البلاي ليستات (Playlists command)
//  ------------------------------------------------------------
//  بلاي ليست / بلاي ليستات / قوائم التشغيل / قوائم / playlists
//  ------------------------------------------------------------
//  بيعرض البلاي ليستات المحفوظة في فولدر Playlists/ (ملف .txt
//  لكل بلاي ليست)، وعدد الأغاني في كل واحدة.
//  عشان تشغّل واحدة: "شغل بلاي ليست <اسم>".
//  عشان تعمل واحدة جديدة: "playlist make <اسم>" (أمر الأونر).
//  Lists the saved playlists in the Playlists/ folder (one .txt file
//  per playlist) with the track count of each.
//  To play one: "شغل بلاي ليست <name>".
//  To create one: "playlist make <name>" (an Owner command).
// ============================================================
const { listPlaylists, playlistFile } = require('../../music/playback');
const fs = require('fs');

module.exports = {
  name: 'playlists',
  aliases: ['pls'],
  ar: ['بلاي ليست', 'بلاي ليستات', 'قوائم التشغيل', 'قوائم'],
  category: 'Music',
  args: '',
  help: 'shows the available playlists',

  async run(ctx) {
    const names = listPlaylists();
    if (!names.length) return ctx.jerr('There are no playlists! Use `!playlist make <name>` to create one.');
    const lines = names.map((n) => {
      const { file } = playlistFile(n);
      let count = 0;
      try { count = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).length; } catch { /* ignore */ }
      return `\`${n}\` (${count} tracks)`;
    });
    return ctx.send({ content: `📜 **Playlists**\n${lines.join('\n')}` });
  },
};
