// ============================================================
//  history.js — أمر السجل (History command)
//  ------------------------------------------------------------
//  السجل / سجل / history
//  ------------------------------------------------------------
//  بيعرض الأغاني اللي اتشغّلت قبل كده (من الأحدث للأقدم)،
//  10 في الصفحة (ممكن تكتب رقم صفحة: "السجل 2").
//  الرد نصي عادي (مش إمبيديد).
//  Shows the songs that were played before (newest first),
//  10 per page (pass a page number: "السجل 2").
//  Reply is plain text (not an embed).
// ============================================================
const { formatDuration, toInt, truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'history',
  aliases: [],
  ar: ['السجل', 'سجل'],
  category: 'Music',
  args: '[pagenum]',
  help: 'shows recently played tracks (history queue)',

  async run(ctx) {
    const { music } = ctx;
    const hist = [...music.history].reverse();
    if (!hist.length) return ctx.jerr('No tracks in history yet.');
    const perPage = 10;
    const pages = Math.max(1, Math.ceil(hist.length / perPage));
    const page = Math.min(Math.max(toInt(ctx.args[0]) || 1, 1), pages);
    const start = (page - 1) * perPage;
    const lines = hist.slice(start, start + perPage)
      .map((it, i) => `\`${start + i + 1}.\` ${escapeMd(truncate(it.title, 60))} \`${it.isStream ? 'LIVE' : formatDuration(it.length)}\` • <@${it.requesterId}>`);
    return ctx.send({ content: `🕘 **History** (recently played)\n${lines.join('\n')}\nPage ${page}/${pages} • ${hist.length} tracks` });
  },
};
