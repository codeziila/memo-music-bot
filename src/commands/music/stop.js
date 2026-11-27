// ============================================================
//  stop.js — أمر الإيقاف (Stop command)
//  ------------------------------------------------------------
//  وقف / ستوب / اطفي / stop (وكمان leave بالإنجليزي)
//  ------------------------------------------------------------
//  بيوقف الموسيقى فورًا ويمسح القائمة كلها، بس البوت بيفضل في
//  الروم (مش بيطلع). الرد إمبيديد سماوي بإيموجي music2.
//  Stops the music instantly and clears the whole queue, but the bot
//  stays in the channel (it doesn't leave). Reply is a sky-blue
//  embed with the music2 emoji.
//  ملحوظة: "leave" بالإنجليزي بيوصل للأمر ده (يعني بيوقف الموسيقى)،
//  أما "اطلع" بالعربي فهي أمر تاني (leave.js) بيطلّع البوت من الروم.
//  Note: English "leave" reaches THIS command (stops the music),
//  while Arabic "اطلع" is a different command (leave.js) that makes
//  the bot leave the channel.
// ============================================================
const embeds = require('../../utils/embeds');
const { config } = require('../../config');

module.exports = {
  name: 'stop',
  aliases: ['leave'],
  ar: ['وقف', 'ستوب', 'اطفي'],
  category: 'DJ',
  args: '',
  help: 'stops the current song and clears the queue',
  voice: true,
  dj: true,

  async run(ctx) {
    if (!ctx.music.alive) return ctx.jerr('There is no music playing right now!');
    await ctx.music.stop();
    return ctx.send({ embeds: [embeds.info(`${config.emojis.music2} Stopped the music and cleared the queue.`)] });
  },
};
