// ============================================================
//  nowplaying.js — أمر "إيه اللي شغال دلوقتي" (Now Playing command)
//  ------------------------------------------------------------
//  الحالي / شغال ايه / الان / دلوقتي / nowplaying
//  ------------------------------------------------------------
//  بيعرض الأغنية اللي شغالة دلوقتي في إمبيديد (ستايل LunaBot):
//  صاحب الطلب كـ author، العنوان، شريط تقدم [0:10/03:35]،
//  🔊 [الصوت]، والبوت كـ footer — مع الأزرار (⏮ ⏯ ⏭ 🔁 🛑).
//  Shows the song playing now in an embed (LunaBot style): the
//  requester as author, the title, a progress bar [0:10/03:35],
//  🔊 [volume], and the bot as footer — with buttons (⏮ ⏯ ⏭ 🔁 🛑).
// ============================================================
const { needPlaying } = require('../../music/playback');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current', 'now'],
  ar: ['الحالي', 'شغال ايه', 'الان', 'دلوقتي'],
  category: 'Music',
  args: '',
  help: 'shows the song that is currently playing',
  voice: true,

  async run(ctx) {
    if (!needPlaying(ctx)) return;
    ctx.music.lang = 'en';
    const np = ctx.music.nowPlayingMessage();
    if (!np) return ctx.send({ content: '🚫 Nothing is playing right now!' });
    return ctx.send({ embeds: [np] });
  },
};
