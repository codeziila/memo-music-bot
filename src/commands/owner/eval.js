// ============================================================
//  eval.js — أمر تنفيذ الكود (Eval command) — معطّل ⚠️
//  ------------------------------------------------------------
//  eval
//  ------------------------------------------------------------
//  ⚠️ الأمر ده متسجّل هنا بس عشان "مساعده eval" يشتغل ويطلع
//  في القائمة — لكنه مبيشغّلش أي كود أبدًا.
//  تنفيذ كود من رسالة ديسكورد هو أخطر حاجة ممكن تعملها في بوت:
//  أي حد يوصل للأمر ده يقدر يسرق التوكنات ويسيطر على البوت
//  والسيرفر كله. عشان كده الراوتر بيعترضه قبل ما يوصل هنا
//  وبيرد برسالة إن الأمر معطّل.
//  لو شفت الملف ده وعايز تشغّل eval "للتجربة" — متعملش كده.
//  ⚠️ This command is registered here only so "مساعده eval" works
//  and it shows in the list — but it NEVER runs any code.
//  Running code from a Discord message is the most dangerous thing
//  a bot can do: anyone who reaches this command can steal the tokens
//  and take over the bot and the whole server. That's why the router
//  intercepts it before it ever gets here and replies that it is disabled.
//  If you see this file and want to enable eval "just to try" — don't.
// ============================================================
module.exports = {
  name: 'eval',
  aliases: [],
  ar: [],
  category: 'Owner',
  args: '',
  help: 'evaluates code (DISABLED — see README-JMUSIC.md)',
  owner: true,

  async run() {
    // معطّل عمدًا — مبيشغّلش كود أبدًا.
    // Intentionally disabled — never runs code.
    return null;
  },
};
