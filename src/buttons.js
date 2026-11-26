// ============================================================
//  buttons.js — أزرار رسالة "شغال دلوقتي" (Now Playing buttons)
//  ------------------------------------------------------------
//  رسالة Now Playing (اللي بيطلعها أمر `الان`) فيها أزرار:
//  ⏮️ السابق | ⏸️/▶️ إيقاف/تكملة | ⏭️ تخطي | ⏹️ وقف | 🔁 تكرار
//  🔀 خلط | 🔉 صوت أقل | 🔊 صوت أعلى | 📜 القائمة
//  الملف ده هو اللي بيستقبل ضغطات الأزرار دي وينفذها.
//  The Now Playing message (from `الان` / nowplaying) has buttons:
//  ⏮️ previous | ⏸️/▶️ pause/resume | ⏭️ skip | ⏹️ stop | 🔁 loop
//  🔀 shuffle | 🔉 volume down | 🔊 volume up | 📜 queue
//  This file handles those button presses.
//  ملحوظة: زرار 🔁 بيلف بين off ➜ track ➜ queue ➜ off (زي ما كان في
//  v1.0.0). أمر `تكرار` نفسه on/off بس — الزرار لسه بالسلوك القديم.
//  Note: the 🔁 button still cycles off ➜ track ➜ queue ➜ off (as in
//  v1.0.0). The `تكرار` command itself is on/off only.
// ============================================================
const { MessageFlags } = require('discord.js');
const { config } = require('./config');
const i18n = require('./i18n');
const { formatDuration, truncate, escapeMd } = require('./utils/format');

// استقبل ضغطة زرار من رسالة موسيقى (customId بيبدأ بـ "music:").
// Handle a button press from a music message (customId starts with "music:").
async function handleButton(bot, interaction) {
  const action = interaction.customId.split(':')[1];
  const music = bot.getMusic(interaction.guildId, false);
  const t = i18n(music?.lang || 'ar');
  // رد خاص (Ephemeral) — بيظهر للي ضغط بس، مش لكل الروم.
  // Ephemeral reply — only visible to the person who pressed the button.
  const eph = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});

  if (!music || !music.alive) return eph(t.nothingPlaying);
  const userVc = interaction.member?.voice?.channelId;
  if (!userVc || userVc !== music.channelId) return eph(t.notInMyChannel(music.channelId));

  switch (action) {
    case 'pause': {
      if (!music.current) return eph(t.nothingPlaying);
      await music.player.setPaused(!music.player.paused);
      return interaction
        .update({ embeds: [music.nowPlayingEmbed()], components: music.buildButtons() })
        .catch(() => {});
    }
    case 'skip': {
      if (!music.current) return eph(t.nothingPlaying);
      const title = music.current.title;
      await music.skip();
      return eph(t.skipped(escapeMd(truncate(title, 80))));
    }
    case 'stop': {
      await music.stop();
      return eph(t.stopped);
    }
    case 'previous': {
      const prev = await music.previous();
      return eph(prev ? t.previousPlaying(escapeMd(truncate(prev.title, 80))) : t.previousNone);
    }
    case 'loop': {
      music.loop = music.loop === 'off' ? 'track' : music.loop === 'track' ? 'queue' : 'off';
      return interaction
        .update({ embeds: [music.nowPlayingEmbed()], components: music.buildButtons() })
        .catch(() => {});
    }
    case 'shuffle': {
      if (music.queue.length < 2) return eph(t.notEnough);
      music.shuffle();
      return eph(t.shuffled(music.queue.length));
    }
    case 'voldown':
    case 'volup': {
      const delta = action === 'volup' ? 10 : -10;
      const v = Math.max(0, Math.min(config.maxVolume, music.volume + delta));
      await music.setVolume(v);
      return interaction
        .update({ embeds: [music.nowPlayingEmbed()], components: music.buildButtons() })
        .catch(() => {});
    }
    case 'queue': {
      if (!music.queue.length) return eph(t.queueEmpty);
      const lines = music.queue
        .slice(0, 10)
        .map((it, i) => `\`${i + 1}.\` ${escapeMd(truncate(it.title, 60))} \`${it.isStream ? t.live : formatDuration(it.length)}\``);
      if (music.queue.length > 10) lines.push(`… +${music.queue.length - 10}`);
      return eph(lines.join('\n'));
    }
    default:
      return eph(t.error);
  }
}

// استقبل اختيار فلتر من القائمة المنسدلة (customId = "music:filter").
// Handle a filter pick from the Dropdown menu (customId "music:filter").
// بيطبّق الفلتر المختار، وبعدين بيحدّث نفس الرسالة عشان تبين الفلتر
// الحالي متعلّم عليه في القائمة. لو مفيش حاجة شغالة أو المستخدم مش
// في روم البوت، بيرد برسالة خاصة (Ephemeral) للي ضغط بس.
// Applies the picked filter, then updates the same message so the menu
// shows the new active filter as default. If nothing is playing or the
// user is not in the bot's voice channel, replies Ephemeral to the presser.
async function handleFilterSelect(bot, interaction) {
  const music = bot.getMusic(interaction.guildId, false);
  const t = i18n(music?.lang || 'ar');
  const eph = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});

  const value = interaction.values?.[0];
  if (!value) return eph(t.error);
  if (!music || !music.alive) return eph(t.nothingPlaying);
  const userVc = interaction.member?.voice?.channelId;
  if (!userVc || userVc !== music.channelId) return eph(t.notInMyChannel(music.channelId));

  await music.setFilter(value === 'none' ? 'none' : value);
  const { buildFilterPicker } = require('./commands/music/filter');
  return interaction.update(buildFilterPicker(music, music.lang || 'ar')).catch(() => {});
}

module.exports = { handleButton, handleFilterSelect };
