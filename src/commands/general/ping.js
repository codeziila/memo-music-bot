// ============================================================
//  ping.js — أمر البنج (Ping command)
//  ------------------------------------------------------------
//  بنج / ping
//  ------------------------------------------------------------
//  بيقيس سرعة استجابة البوت (latency) وسرعة الـ API، وبيعرضهم
//  في بلوك كود. لو ws.ping لسه -1 (بعد ريستارت وقبل أول heartbeat)،
//  بيقيسها بطلب REST بداله.
//  Measures the bot's latency and API latency, shown in a code block.
//  When ws.ping is still -1 (right after a restart, before the first
//  heartbeat), it times a REST call instead.
// ============================================================
module.exports = {
  name: 'ping',
  aliases: [],
  ar: ['بنج', 'بينج'],
  category: 'General',
  args: '',
  help: "checks the bot's latency",

  async run(ctx) {
    const start = Date.now();
    const msg = await ctx.send({ content: '```\nlatency: ...\nAPI latency: ...\n```' });
    if (!msg) return;
    const latency = Date.now() - start;
    let api = Math.round(ctx.bot.client.ws.ping);
    if (api < 0) {
      const t0 = Date.now();
      try {
        await ctx.bot.client.rest.get('/users/@me');
        api = Date.now() - t0;
      } catch {
        api = latency;
      }
    }
    await msg.edit({ content: '```\nlatency: ' + latency + 'ms.\nAPI latency: ' + api + 'ms.\n```' }).catch(() => {});
  },
};
