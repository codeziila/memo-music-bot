// ============================================================
//  leave.js — أمر خروج البوت من الروم (Leave command)
//  ------------------------------------------------------------
//  اطلع / اخرج / بره / غادر / leave (بس بالإنجليزي "leave"
//  بيوصل لأمر "وقف" — شوف stop.js)
//  ------------------------------------------------------------
//  بيطلّع البوت من الروم الصوتي اللي هو فيه.
//  لو البوت متثبت في الروم (ثبت)، مش هيطلع — لازم تفك التثبيت
//  الأول ("فك التثبيت").
//  (الأمر ده من الطبقة القديمة، فبيرد بالعربي أو الإنجليزي
//  حسب لغة الأمر — عن طريق ctx.t.)
//  Makes the bot leave the voice channel it is in.
//  When the bot is pinned (ثبت), it won't leave — unpin it first
//  ("فك التثبيت").
//  (This command comes from the old layer, so it replies in Arabic or
//  English depending on the command's language — via ctx.t.)
//  ملحوظة: "leave" بالإنجليزي بيوصل لأمر "وقف" (stop.js) مش للأمر
//  ده، لأن "وقف" ليه الأولوية في البحث. عشان تطلّع البوت بالإنجليزي،
//  استخدم "dc" أو "disconnect".
//  Note: English "leave" reaches the "وقف" command (stop.js), not
//  this one, because "وقف" wins the lookup. To make the bot leave in
//  English, use "dc" or "disconnect".
// ============================================================
module.exports = {
  name: 'leave',
  aliases: ['dc', 'disconnect'],
  ar: ['اطلع', 'اخرج', 'بره', 'غادر'],
  category: 'Music',
  args: '',
  help: 'makes the bot leave the channel',
  voice: true,

  async run(ctx) {
    if (ctx.music.pinned) return ctx.err(ctx.t.pinnedCantLeave);
    await ctx.music.destroy();
    return ctx.ok(ctx.t.left);
  },
};
