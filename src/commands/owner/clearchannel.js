// ============================================================
//  clearchannel.js — أمر مسح الشات (Clear Channel command)
//  ------------------------------------------------------------
//  مسح الشات / نضف الشات / امسح الشات / clearchannel
//  ------------------------------------------------------------
//  بيمسح آخر 100 رسالة في الروم اللي اتكتب فيه الأمر.
//  ⚠️ أمر قوي وخطير — بيمسح رسايل ناس تانية، مش رسايل البوت بس.
//  عشان كده هو لصاحب البوت Mimo بس (Owner only)، مش لأي أدمن.
//  ملحوظة: ده غير أمر "مسح" (اللي كان بيمسح القائمة) —
//  أمر "مسح" اتشال من البوت خالص ومش موجود.
//  Deletes the last 100 messages in the channel where it was typed.
//  ⚠️ A powerful and dangerous command — it deletes other people's
//  messages, not just the bot's. That's why it is for the bot owner
//  Mimo only (Owner only), not for any admin.
//  Note: this is different from the old "مسح" command (which cleared
//  the queue) — that command was removed from the bot entirely.
// ============================================================
module.exports = {
  name: 'clearchannel',
  aliases: [],
  ar: ['مسح الشات', 'نضف الشات', 'امسح الشات'],
  category: 'Owner',
  args: '',
  help: 'clears all messages in the command channel',
  owner: true,

  async run(ctx) {
    const ch = ctx.channel;
    if (!ch || !ch.isTextBased() || typeof ch.bulkDelete !== 'function') return ctx.jerr('Cannot clear this channel.');
    try {
      const msgs = await ch.messages.fetch({ limit: 100 });
      const del = await ch.bulkDelete(msgs, true);
      return ctx.send({ content: `🧹 Cleared ${del?.size ?? 0} messages.` });
    } catch (e) {
      return ctx.jerr(`Could not clear the channel: ${e.message}`);
    }
  },
};
