// ============================================================
//  volume.js — أمر الصوت (Volume command)
//  ------------------------------------------------------------
//  صوت / الصوت / volume
//  ------------------------------------------------------------
//  • "صوت" لوحدها: بيعرض الصوت الحالي مع شريط (█░░░░░░░░░).
//  • "صوت 80": بيظبط الصوت على 80% (من 0 لحد 150).
//  الصوت الافتراضي 100%. الرد إمبيديد سماوي بإيموجي music3.
//  (الأمر ده للمشرفين DJ بس.)
//  • Bare "صوت": shows the current volume with a bar (█░░░░░░░░░).
//  • "صوت 80": sets the volume to 80% (0 to 150).
//  Default volume is 100%. Reply is a sky-blue embed with music3.
//  (DJs only.)
// ============================================================
const { config } = require('../../config');
const settings = require('../../store/settings');
const embeds = require('../../utils/embeds');
const { toInt } = require('../../utils/format');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  ar: ['صوت', 'الصوت'],
  category: 'DJ',
  args: '[0-150]',
  help: 'sets or shows volume',
  voice: true,
  dj: true,

  async run(ctx) {
    const { music } = ctx;
    const volBar = (v) => {
      const n = Math.max(0, Math.min(10, Math.round((v / config.maxVolume) * 10)));
      return '█'.repeat(n) + '░'.repeat(10 - n);
    };
    if (!ctx.args[0]) return ctx.send({ embeds: [embeds.info(`<:music3:1575843610270634064> **Volume: ${music.volume}%**\n${volBar(music.volume)}`)] });
    const v = toInt(ctx.args[0]);
    if (Number.isNaN(v) || v < 0 || v > config.maxVolume) return ctx.jerr(`Volume must be between 0 and ${config.maxVolume}!`);
    await music.setVolume(v);
    settings.update(ctx.guild.id, { volume: v });
    music.refreshNowPlaying();
    return ctx.send({ embeds: [embeds.info(`<:music3:1575843610270634064> **Volume set to ${v}%**\n${volBar(v)}`)] });
  },
};
