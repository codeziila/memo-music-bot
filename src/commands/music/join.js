// ============================================================
//  join.js — أمر دخول البوت للروم (Join command)
//  ------------------------------------------------------------
//  join (مفيش اسم عربي — الأمر بالإنجليزي بس)
//  ------------------------------------------------------------
//  بيخلي البوت يدخل الروم الصوتي اللي انت فيه (من غير ما يشغّل
//  أغنية). لو البوت مش متثبت في روم، هيطلع لوحده بعد 60 ثانية
//  من غير موسيقى (إلا لو اتثبت).
//  (الأمر ده من الطبقة القديمة، فبيرد بالعربي أو الإنجليزي
//  حسب لغة الأمر — عن طريق ctx.t.)
//  Makes the bot join your voice channel (without playing a song).
//  When the bot isn't pinned, it leaves by itself after 60 seconds
//  of no music (unless it gets pinned).
//  (This command comes from the old layer, so it replies in Arabic or
//  English depending on the command's language — via ctx.t.)
// ============================================================
module.exports = {
  name: 'join',
  aliases: ['j', 'come'],
  ar: [],
  category: 'Music',
  args: '',
  help: 'makes the bot join your channel',
  voice: true,
  summon: true,

  async run(ctx) {
    if (ctx.music.alive && ctx.bot.voiceChannelId(ctx.guild.id) === ctx.targetVoiceId) return ctx.ok(ctx.t.alreadyHere);
    await ctx.music.connect(ctx.targetVoiceId);
    if (!ctx.music.pinned) ctx.music.scheduleIdleLeave();
    return ctx.ok(ctx.t.joined(ctx.targetVoiceId));
  },
};
