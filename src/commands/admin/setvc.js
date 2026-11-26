// ============================================================
//  setvc.js — أمر تحديد روم الصوت (Set Voice Channel command)
//  ------------------------------------------------------------
//  روم الصوت / قناه الصوت / حدد روم الصوت / setvc
//  ------------------------------------------------------------
//  بيحدد روم الصوت اللي الموسيقى بتشتغل فيه.
//  مثال: "روم الصوت موسيقى" — من بعدها البوت بيدخل روم "موسيقى"
//  لما حد يشغّل أغنية (حتى لو هو في روم تاني).
//  "روم الصوت NONE" — بيلغي التحديد؛ البوت بيدخل روم اللي
//  بيطلب الأغنية.
//  (الأمر ده للمشرفين Manage Server بس.)
//  Sets the voice channel where music plays.
//  Example: "روم الصوت music" — after that, the bot joins the
//  "music" channel when someone plays a song (even from another channel).
//  "روم الصوت NONE" — removes it; the bot joins the requester's channel.
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
  name: 'setvc',
  aliases: [],
  ar: ['روم الصوت', 'قناه الصوت', 'حدد روم الصوت'],
  category: 'Admin',
  args: '<channel|NONE>',
  help: 'sets the voice channel for playing music',
  admin: true,

  async run(ctx) {
    const arg = ctx.args.join(' ').trim();
    if (!arg) return ctx.jerr('You must include a channel! Example: `!setvc Music` or `!setvc NONE`');
    if (arg.toUpperCase() === 'NONE') {
      settings.update(ctx.guild.id, { voiceChannelId: '0' });
      return ctx.jok('The bot will now join the voice channel of whoever uses a command.');
    }
    const ch = channelFromArg(ctx.guild, arg, true);
    if (!ch) return ctx.jerr('Could not find that voice channel!');
    settings.update(ctx.guild.id, { voiceChannelId: ch.id });
    return ctx.jok(`Music will now play in <#${ch.id}>.`);
  },
};
