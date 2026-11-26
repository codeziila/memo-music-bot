// ============================================================
//  index.js — نقطة البداية (Entry point)
//  ------------------------------------------------------------
//  بيشغّل البوت: يقرا التوكنات من tokens.txt (أو TOKENS في .env)،
//  ويعمل بوت (BotInstance) لكل توكن، ويسجّل دخولهم واحد ورا التاني.
//  Starts the bot: reads tokens from tokens.txt (or TOKENS in .env),
//  creates one BotInstance per token, and logs them in one by one.
//  التشغيل: npm start  (أو: node src/index.js)
//  Run with: npm start  (or: node src/index.js)
// ============================================================
require('dotenv').config();
const { config, loadTokens } = require('./config');
const registry = require('./registry');
const BotInstance = require('./bot');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

(async () => {
  const tokens = loadTokens();
  if (!tokens.length) {
    console.error('مفيش توكنات. حطها في tokens.txt (كل توكن في سطر) أو في TOKENS داخل .env');
    console.error('No tokens found. Put them in tokens.txt (one per line) or in TOKENS inside .env');
    process.exit(1);
  }
  console.log(`Starting ${tokens.length} bot(s) | Audio nodes: ${config.nodes.map((n) => `${n.name}@${n.url}`).join(', ')}`);

  for (let i = 0; i < tokens.length; i++) {
    const bot = new BotInstance(tokens[i], i);
    registry.add(bot);
    bot.start().catch((e) => console.error(`[Bot#${i + 1}] login failed: ${e.message}`));
    if (i < tokens.length - 1) await sleep(config.loginDelayMs);
  }
})();
