// ============================================================
//  setgame.js — أمر تغيير حالة اللعب (Set Game command)
//  ------------------------------------------------------------
//  اللعبه / غير اللعبه / اللعبة / setgame
//  ------------------------------------------------------------
//  بيغيّر النشاط اللي البوت بيعرضه تحت اسمه في ديسكورد
//  ("Playing ..." / "Listening to ..." / "Watching ..." / "Streaming ...").
//  مثال: "اللعبه streaming By Memo" — أو "اللعبه playing موسيقى".
//  لو مكتبتش نوع، الافتراضي Listening. ولو مكتبتش نص، بيرجع
//  للحالة الافتراضية ("By Memo").
//  (الأمر ده لصاحب البوت Mimo بس — Owner only.)
//  Changes the activity the bot shows under its name in Discord
//  ("Playing ..." / "Listening to ..." / "Watching ..." / "Streaming ...").
//  Example: "اللعبه streaming By Memo" — or "اللعبه playing Music".
//  When no type is given, it defaults to Listening. When no text is
//  given, it goes back to the default ("By Memo").
//  (Bot owner Mimo only — Owner only.)
// ============================================================
const { ActivityType } = require('discord.js');
const { config } = require('../../config');
const { truncate, escapeMd } = require('../../utils/format');

module.exports = {
  name: 'setgame',
  aliases: [],
  ar: ['اللعبه', 'غير اللعبه', 'اللعبة'],
  category: 'Owner',
  args: '[action] [game]',
  help: 'sets the game the bot is playing',
  owner: true,

  async run(ctx) {
    const action = (ctx.args[0] || '').toLowerCase();
    const types = { playing: ActivityType.Playing, listening: ActivityType.Listening, listen: ActivityType.Listening, watching: ActivityType.Watching, watch: ActivityType.Watching, streaming: ActivityType.Streaming, stream: ActivityType.Streaming };
    let type = ActivityType.Listening;
    let game = ctx.args.join(' ').trim();
    if (types[action]) {
      type = types[action];
      game = ctx.args.slice(1).join(' ').trim();
    }
    if (!game) game = config.status;
    const opts = { type };
    if (type === ActivityType.Streaming) opts.url = 'https://www.twitch.tv/memo';
    await ctx.bot.client.user.setActivity(game, opts);
    return ctx.jok(`Game set to **${escapeMd(truncate(game, 80))}**.`);
  },
};
