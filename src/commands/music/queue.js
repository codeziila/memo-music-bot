// ============================================================
//  queue.js — أمر عرض القائمة (Queue command)
//  ------------------------------------------------------------
//  القائمه / قائمه / الطابور / الكيو / queue
//  ------------------------------------------------------------
//  بيعرض الأغنية اللي شغالة دلوقتي + الأغاني اللي بعدها في الطابور،
//  10 في الصفحة (ممكن تكتب رقم صفحة: "القائمه 2").
//  الرد نصي عادي (مش إمبيديد).
//  Shows the song playing now + the songs after it in the queue,
//  10 per page (pass a page number: "القائمه 2").
//  Reply is plain text (not an embed).
// ============================================================
const { formatDuration, toInt, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'queue',
  aliases: ['list', 'q'],
  ar: ['القائمه', 'قائمه', 'الطابور', 'الكيو'],
  category: 'Music',
  args: '[pagenum]',
  help: 'shows the current queue',
  voice: true,

  async run(ctx) {
    const { music } = ctx;
    if (!music.current && !music.queue.length) return ctx.jerr('The queue is empty.');
    const perPage = 10;
    const pages = Math.max(1, Math.ceil(music.queue.length / perPage));
    const page = Math.min(Math.max(toInt(ctx.args[0]) || 1, 1), pages);
    const start = (page - 1) * perPage;
    const lines = music.queue.slice(start, start + perPage)
      .map((it, i) => `\`${start + i + 1}.\` ${escapeMd(truncate(it.title, 60))} \`${it.isStream ? 'LIVE' : formatDuration(it.length)}\` • <@${it.requesterId}>`);
    const total = music.queue.reduce((a, it) => a + (it.isStream ? 0 : it.length), 0) + (music.current && !music.current.isStream ? music.current.length : 0);
    const text = `📜 **Queue**\n` +
      (music.current ? `🎶 Now playing: ${escapeMd(truncate(music.current.title, 90))} • <@${music.current.requesterId}>\n` : '') +
      `Up next:\n${lines.length ? lines.join('\n').slice(0, 1024) : '-'}\n` +
      `Page ${page}/${pages} • ${music.queue.length} tracks • Total ${formatDuration(total)}`;
    return ctx.send({ content: text });
  },
};
