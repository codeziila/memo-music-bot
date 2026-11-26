// ============================================================
//  registry.js — سجل كل البوتات الشغالة (Registry of all bots)
//  ------------------------------------------------------------
//  كل البوتات (واحد لكل توكن في tokens.txt) بتتسجل هنا، عشان
//  الراوتر يقدر يلاقي البوت المناسب لأي سيرفر وأي روم صوتي.
//  All bots (one per token in tokens.txt) register here, so the
//  router can find the right bot for any guild and voice channel.
// ============================================================
const bots = [];

module.exports = {
  // سجّل بوت جديد. — Register a new bot.
  add(bot) {
    bots.push(bot);
  },

  // كل البوتات. — All bots.
  all() {
    return bots;
  },

  // هات بوت بالـ ID بتاعه (أو null). — Find a bot by its user ID.
  get(id) {
    return bots.find((b) => b.id === id) || null;
  },

  // هل الآي دي ده بتاع بوت موسيقى من بتوعنا؟ — Is this ID one of our bots?
  isMusicBot(id) {
    return bots.some((b) => b.id === id);
  },

  // البوتات اللي في سيرفر معيّن (والجاهزة)، مرتبة برقم البوت.
  // Bots in a guild (that are ready), sorted by bot index.
  inGuild(guildId) {
    return bots
      .filter((b) => b.ready && b.client.guilds.cache.has(guildId))
      .sort((a, b) => a.index - b.index);
  },
};
