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
const embeds = require('./utils/embeds');
const { enqueueTracks, EMOJI } = require('./music/playback');
const { getSearch, deleteSearch } = require('./music/searchStore');
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

// استقبل اختيار أغنية من قائمة نتايج البحث (customId = "music:search:<id>").
// Handle a song pick from a search-results menu (customId "music:search:<id>").
// القائمة للي عمل البحث بس، ولازم يكون في روم البوت. الاختيار بيشغّل
// الأغنية (بنفس بدائل فشل التشغيل بتاعة البحث بالاسم: باقي النتايج +
// سبوتيفاي)، وبيحدّث رسالة البحث نفسها عشان القائمة متتضغطش تاني.
// Only the searcher can pick, and they must be in the bot's voice
// channel. The pick plays the song (with the same name-search failure
// fallbacks: the other results + Spotify) and updates the search
// message itself so the menu can't be pressed again.
async function handleSearchSelect(bot, interaction) {
  const id = interaction.customId.split(':')[2];
  const entry = getSearch(id);
  const eph = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
  if (!entry) return eph('البحث ده خلص — ابحث تاني.');
  if (interaction.user.id !== entry.authorId) return eph('القائمة دي للي عمل البحث بس.');
  const idx = Number(interaction.values?.[0]);
  const track = entry.tracks[idx];
  if (!track) return eph('حصلت مشكلة.');
  const userVc = interaction.member?.voice?.channelId;
  if (!userVc) return eph('لازم تكون في روم صوتي عشان تشغّل.');
  const music = bot.getMusic(interaction.guildId);
  if (music?.channelId && music.channelId !== userVc) return eph(`البوت في روم تانية — ادخل <#${music.channelId}> الأول.`);
  await interaction.deferUpdate().catch(() => {});
  // ctx مصغّر للـ interaction (enqueueTracks بيحتاج نفس شكل ctx بتاع الـ router).
  // A minimal ctx for the interaction (enqueueTracks expects the router's ctx shape).
  const ctx = {
    bot,
    guild: interaction.guild,
    channel: interaction.channel,
    member: interaction.member,
    author: interaction.user,
    music,
    targetVoiceId: userVc,
    send: (payload) => interaction.channel.send(payload).catch(() => null),
    ok: (text) => interaction.channel.send({ embeds: [embeds.info(text)] }).catch(() => null),
    err: (text) => interaction.followUp({ embeds: [embeds.error(text)], flags: MessageFlags.Ephemeral }).catch(() => {}),
    jok: (text) => interaction.channel.send({ embeds: [embeds.info(`${EMOJI.success} ${text}`)] }).catch(() => null),
    jwarn: (text) => interaction.channel.send({ embeds: [embeds.info(`${EMOJI.warning} ${text}`)] }).catch(() => null),
    jerr: (text) => interaction.followUp({ embeds: [embeds.error(text)], flags: MessageFlags.Ephemeral }).catch(() => {}),
  };
  const others = entry.tracks.filter((_, i) => i !== idx);
  await enqueueTracks(ctx, [track], { searchQuery: entry.query, alternatives: others }).catch(() => false);
  deleteSearch(id);
  return interaction
    .editReply({
      content: `${EMOJI.searching} **Search results for: ${truncate(entry.query, 200)}**\n🎵 اخترت: **${escapeMd(truncate(track.info.title, 100))}**`,
      components: [],
    })
    .catch(() => {});
}

module.exports = { handleButton, handleFilterSelect, handleSearchSelect };
