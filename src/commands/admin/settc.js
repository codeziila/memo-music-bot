// ============================================================
//  settc.js — أمر تحديد روم الكتابة (Set Text Channel command)
//  ------------------------------------------------------------
//  روم الكتابه / قناه الكتابه / حدد روم الكتابه / settc
//  ------------------------------------------------------------
//  بيحدد روم الكتابة اللي أوامر الموسيقى بتشتغل فيه بس.
//  مثال: "روم الكتابه #موسيقى" — من بعدها أوامر الموسيقى
//  بتشتغل في #موسيقى بس (أوامر الأدمن والأونر مستثناة).
//  "روم الكتابه NONE" — بيلغي القيد؛ الموسيقى بتشتغل في أي روم.
//  (الأمر ده للمشرفين Manage Server بس.)
//  Sets the text channel where music commands work.
//  Example: "روم الكتابه #music" — after that, music commands only
//  work in #music (admin/owner commands are exempt).
//  "روم الكتابه NONE" — removes the restriction; music works anywhere.
//  (Manage Server only.)
// ============================================================
const settings = require('../../store/settings');

function channelFromArg(guild, arg, voice) {
  if (!arg) return null;
  const id = arg.replace(/[<#>]/g, '');
  let ch = guild.channels.cache.get(id);
  if (!ch) {
    const name = arg.replace(/^#/, '').toLowerCase();
    ch = guild.channels.cache.find((c) => c.name.toLowerCase() === name && (voice ? c.isVoiceBased() : c.isTextBased()));
  }
  if (!ch) return null;
  if (voice && !ch.isVoiceBased()) return null;
  if (!voice && !ch.isTextBased()) return null;
  return ch;
}

module.exports = {
  name: 'settc',
  aliases: [],
  ar: ['روم الكتابه', 'قناه الكتابه', 'حدد روم الكتابه'],
  category: 'Admin',
  args: '<channel|NONE>',
  help: 'sets the text channel for music commands',
  admin: true,

  async run(ctx) {
    const arg = ctx.args.join(' ').trim();
    if (!arg) return ctx.jerr('You must include a channel! Example: `!settc #music` or `!settc NONE`');
    if (arg.toUpperCase() === 'NONE') {
      settings.update(ctx.guild.id, { textChannelId: '0' });
      return ctx.jok('Music commands can now be used in any text channel.');
    }
    const ch = channelFromArg(ctx.guild, arg, false);
    if (!ch) return ctx.jerr('Could not find that text channel!');
    settings.update(ctx.guild.id, { textChannelId: ch.id });
    return ctx.jok(`Music commands can now only be used in <#${ch.id}>.`);
  },
};
