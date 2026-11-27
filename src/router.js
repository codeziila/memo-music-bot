// ============================================================
//  router.js — الراوتر الموحّد (The ONE command router)
//  ------------------------------------------------------------
//  ده قلب البوت: بيستقبل كل رسالة، ويفهم منها الأمر، ويختار البوت
//  المناسب، ويتأكد من الصلاحيات والروم الصوتي، وبعدين يشغّل الأمر.
//  This is the heart of the bot: it receives every message, figures
//  out the command, picks the right bot, checks permissions and the
//  voice channel, then runs the command.
//  ------------------------------------------------------------
//  مفيش بريفكس — الأوامر بتتكتب عارية بالعربي أو الإنجليزي
//  (مثال: "شغل تملي معاك"، "skip"، "مساعده"). وممكن تمنشن بوت
//  معيّن قبل الأمر (مثال: "@Semo شغل ...") عشان تستهدفه هو.
//  NO PREFIX — commands are bare Arabic/English (e.g. "شغل تملي معاك",
//  "skip", "مساعده"). You may also mention a specific bot before the
//  command (e.g. "@Semo شغل ...") to target that bot.
//  ------------------------------------------------------------
//  القواعد (Rules):
//  • البوت بيرد بس على مستخدم موجود في روم صوتي (بتاع البوت ده).
//    The bot only answers a user who is in a voice channel (its own).
//  • الاستثناء الوحيد: أمر restart (Admin) بيشتغل من أي مكان،
//    حتى لو المستخدم مش في روم صوتي.
//    Exception: restart (Admin) works from anywhere, even with no voice.
//  • الأوامر بتتطابق بالاسم (لحد 3 كلمات) — عشان "بلاي ليست" و
//    "نوع القائمه" يشتغلوا كأمر واحد.
//    Command names match up to 3 words — so "بلاي ليست" works as one.
// ============================================================
const { PermissionFlagsBits } = require('discord.js');
const registry = require('./registry');
const pins = require('./store/pins');
const settings = require('./store/settings');
const i18n = require('./i18n');
const embeds = require('./utils/embeds');
const { normalize } = require('./utils/arabic');
const { config } = require('./config');
const { commands, lookupCommand } = require('./commands');
const { isOwner, isAdmin, isAdministrator, isDJ } = require('./permissions');
const { EMOJI } = require('./music/playback');

// كل البوتات بتستقبل نفس الرسالة، فبنخلي أول واحد "يحجزها" عشان
// بوت واحد بس اللي يرد (مش كل البوتات).
// All bots receive the same message, so the first one "claims" it
// and only that bot answers (not every bot).
const handled = new Set();
function claim(id) {
  if (handled.has(id)) return false;
  handled.add(id);
  setTimeout(() => handled.delete(id), 60000).unref?.();
  return true;
}

// حوّل نص مكتوب (منشن أو اسم روم) لآي دي روم صوتي.
// Turn a written channel (mention or name) into a voice channel ID.
function channelFromArg(guild, arg) {
  if (!arg) return null;
  const id = arg.replace(/[<#>]/g, '');
  const ch = guild.channels.cache.get(id);
  return ch && ch.isVoiceBased() ? ch.id : null;
}

// ---------- اختيار البوت — Picking the right bot ----------
// اختار أنهو بوت ينفذ الأمر، حسب الروم الصوتي المستهدف.
// Pick which bot runs the command, based on the target voice channel.
//  • لو الأمر مش محتاج صوت: البوت اللي في الروم ده، أو المثبت فيه.
//    Non-voice command: the bot in (or pinned to) that channel.
//  • لو محتاج صوت: البوت اللي في الروم، أو المثبت فيه، أو (لو الأمر
//    بيستدعي بوت جديد — summon) بوت فاضي مش متثبت في حتة.
//    Voice command: the bot in/pinned to the channel, or (for summon
//    commands) a free bot that isn't pinned anywhere.
//  • لو مفيش بوت فاضي والأمر بيستدعي: رجّع 'BUSY'.
//    When no free bot exists for a summon command: return 'BUSY'.
function pickBot(bots, guildId, targetVc, command) {
  if (!command.voice) {
    if (!targetVc) return null;
    const inChannel = bots.find((b) => b.targetChannel(guildId) === targetVc);
    if (inChannel) return inChannel;
    const pinnedHere = bots.find((b) => pins.get(b.id, guildId)?.channelId === targetVc);
    if (pinnedHere) return pinnedHere;
    return null;
  }
  if (!targetVc) return command.summon ? bots[0] : null;
  const inChannel = bots.find((b) => b.targetChannel(guildId) === targetVc);
  if (inChannel) return inChannel;
  const pinnedHere = bots.find((b) => pins.get(b.id, guildId)?.channelId === targetVc);
  if (pinnedHere) return pinnedHere;
  if (!command.summon) return null;
  const free = bots.find((b) => !b.targetChannel(guildId) && !pins.get(b.id, guildId));
  return free || 'BUSY';
}

// ---------- بناء الـ ctx — Building the command context ----------
// الـ ctx هو اللي بيوصل لكل أمر: فيه البوت والسيرفر والرسالة والمستخدم
// والأوامر (args)، وحالة الموسيقى، ودوال الرد.
// The ctx is what every command receives: the bot, guild, message,
// user, arguments, music state, and the reply helpers.
async function buildContext(bot, message, parsed, targetVc) {
  const guild = bot.client.guilds.cache.get(message.guild.id);
  const channel =
    bot.client.channels.cache.get(message.channelId) ||
    (await bot.client.channels.fetch(message.channelId).catch(() => null));
  const t = i18n(parsed.lang);

  // ابعت رسالة في نفس الروم (رد على رسالة المستخدم)، ولو فشل
  // (مفيش صلاحية)، رد بالـ reply العادي.
  // Send a message in the same channel (replying to the user's message),
  // falling back to a plain reply when the bot lacks permission there.
  const send = async (payload) => {
    if (channel && channel.isTextBased()) {
      try {
        return await channel.send({
          ...payload,
          reply: { messageReference: message.id, failIfNotExists: false },
          allowedMentions: { parse: [], repliedUser: true },
        });
      } catch {
        /* البوت ممكن ميكونش عنده صلاحية في الروم ده، نرد بالبوت اللي استقبل */
      }
    }
    try {
      return await message.reply({ ...payload, allowedMentions: { parse: [], repliedUser: true } });
    } catch {
      return null;
    }
  };

  return {
    bot,
    guild,
    channel,
    message,
    member: message.member,
    author: message.author,
    args: parsed.args,
    lang: parsed.lang,
    command: parsed.command,
    mentionId: parsed.mentionId || null,
    t,
    music: bot.getMusic(guild.id),
    userVoiceId: message.member?.voice?.channelId || null,
    targetVoiceId: targetVc,
    hasManage: () => !!message.member?.permissions?.has(PermissionFlagsBits.ManageGuild),
    send,
    // --- مساعدات الرد (كلها إمبيديد سماوي) — Reply helpers (all sky-blue embeds) ---
    // ok / err: إمبيديد عادي (من غير إيموجي في الأول).
    // ok / err: plain embed (no emoji prefix).
    ok: (text) => send({ embeds: [embeds.info(text)] }),
    err: (text) => send({ embeds: [embeds.error(text)] }),
    // jok / jwarn / jerr: بأسلوب JMusicBot (🎶 للنجاح، 💡 للتحذير، ❌ للخطأ).
    // jok / jwarn / jerr: JMusicBot-style (🎶 success, 💡 warning, ❌ error).
    jok: (text) => send({ embeds: [embeds.info(`${EMOJI.success} ${text}`)] }),
    jwarn: (text) => send({ embeds: [embeds.info(`${EMOJI.warning} ${text}`)] }),
    jerr: (text) => send({ embeds: [embeds.error(text)] }),
  };
}

// ---------- المعالج الرئيسي — The main handler ----------
// بيستقبل كل رسالة من ديسكورد، ولو كانت أمر بوت، بينفذه.
// Receives every Discord message; when it is a bot command, runs it.
// بيرجّع true لو الرسالة كانت أمر (حتى لو متنفذش لسبب ما)، و false
// لو مش أمر أصلاً (كلام عادي).
// Returns true when the message was a command (even when it wasn't
// executed for some reason), false when it is just normal chat.
async function handle(receiver, message) {
  if (message.author.bot || !message.guild || !message.content) return false;

  // لو الرسالة فيها منشن لبوت تاني (مش أنا)، تجاهلها خالص — حتى لو
  // المنشن في آخر الرسالة مش أولها (زي "pin @Quran" أو "unpin @thelifebeyond").
  // الفحص اللي تحت بيشوف المنشن في أول الرسالة بس (/^<@...>/), فمنشن
  // في الآخر كان بيتعدّى والبوت بيرد على أمر مش موجّه ليه.
  // If the message mentions another bot (not me), ignore it completely —
  // even when the mention is at the end, not the start (e.g. "pin @Quran").
  // The check below only sees a mention at the start of the message, so a
  // trailing mention slipped through and the bot answered a command meant for another bot.
  if (message.mentions?.users) {
    for (const [, user] of message.mentions.users) {
      if (user.bot && user.id !== receiver.id) return false;
    }
  }

  const s = settings.get(message.guild.id);

  // --- 1) افهم الرسالة: منشن + اسم الأمر ---
  // --- 1) Parse the message: mention + command name ---
  let text = message.content.trim();
  let mentionId = null;
  const m = text.match(/^<@!?(\d{15,25})>\s*/);
  if (m) {
    mentionId = m[1];
    if (mentionId !== receiver.id) return false; // منشن بوت تاني، مش أنا
    text = text.slice(m[0].length);
  }
  const body = text.trim();
  if (!body) return false;
  const words = body.split(/\s+/);
  // طابق اسم الأمر (لحد 3 كلمات) — عشان "بلاي ليست" و "نوع القائمه" يشتغلوا.
  // Match the command name (up to 3 words) — so "بلاي ليست" works as one.
  const found = lookupCommand(words);
  if (!found) return false;
  const cmd = found.cmd;
  const args = words.slice(found.used);

  // Mention rule: ONLY restart and pin work by mention. Any other command
  // mentioned is ignored completely — no reply at all.
  // قاعدة المنشن: restart و pin بس اللي بيشتغلوا بالمنشن، وأي أمر تاني
  // بالمنشن بيتجاهل خالص من غير رد.
  if (mentionId && cmd.name !== 'restart' && cmd.name !== 'pin') return false;

  // --- 2) لازم المستخدم يكون في روم صوتي (إلا أمر restart) ---
  // --- 2) The user must be in a voice channel (except restart) ---
  // البوت بيرد بس على مستخدم موجود في روم صوتي. الاستثناء: أمر restart
  // (adminOnly) بيشتغل من أي مكان، حتى من غير صوت.
  // The bot only answers a user in a voice channel. Exception: restart
  // (adminOnly) works from anywhere, even with no voice.
  if (!cmd.adminOnly && !message.member?.voice?.channelId) return false;

  // --- 3) الأوامر اللي لازم تتكتب لوحدها (pinall / unpinall / bots) ---
  // --- 3) Commands that must be typed alone (pinall / unpinall / bots) ---
  // دي أوامر من غير صوت ومن غير آرج، فلو اتكتب بعدها كلام تاني،
  // البوت بيتجاهلها (عشان ميردّش على كلام عادي يبدأ باسمها).
  // These take no voice and no args, so extra words mean "ignore it"
  // (so the bot doesn't answer normal chat that starts with their name).
  if (!cmd.voice && cmd.strict && args.length) return false;

  // --- 4) احجز الرسالة (عشان بوت واحد بس اللي يرد) ---
  // --- 4) Claim the message (so exactly one bot answers) ---
  if (!claim(message.id)) return true;

  const bots = registry.inGuild(message.guild.id);
  if (!bots.length) return true;
  if (mentionId && !registry.isMusicBot(mentionId)) return true;

  // --- 5) حدّد الروم الصوتي المستهدف ---
  // --- 5) Determine the target voice channel ---
  const userVc = message.member?.voice?.channelId || null;
  const targetVc = cmd.channelArg
    ? channelFromArg(message.guild, args[0]) || userVc
    : cmd.voice
      ? userVc || (s.voiceChannelId && s.voiceChannelId !== '0' ? s.voiceChannelId : null)
      : userVc;

  // --- 6) اختار البوت اللي هينفذ ---
  // --- 6) Pick the bot that will run the command ---
  let bot;
  if (mentionId) {
    bot = bots.find((b) => b.id === mentionId);
    if (!bot) return true;
  } else if (cmd.name === 'restart') {
    // restart "all" بيرستّر كل البوتات، فأي بوت يقدر ينفذه.
    // restart لوحده بيرستّر بوت الروم اللي انت فيه؛ ولو مفيش،
    // بناخد أول بوت عشان يرد بالـ usage بدل ما يسكت.
    // restart "all" restarts every bot, so any bot can run it.
    // A bare restart restarts the bot in your channel; fall back to
    // bots[0] so it can reply with usage instead of staying silent.
    const isAll = args[0] && /^(all|الكل)$/i.test(args[0]);
    bot = isAll ? bots[0] : (pickBot(bots, message.guild.id, targetVc, cmd) || bots[0]);
  } else {
    bot = pickBot(bots, message.guild.id, targetVc, cmd);
  }
  // مفيش بوت فاضي ييجي للروم ده — اسكت خالص (من غير رد).
  // قاعدة البوت: ميردّش على حد غير لما يكون معاه في الفويس،
  // و"كل البوتات مشغولة" كانت بتتقال لحد البوت مش معاه أصلًا.
  // No free bot can come to this channel — stay silent (no reply).
  // Bot rule: never answer anyone unless it's with them in voice,
  // and "all bots are busy" was being said to someone no bot is with.
  if (bot === 'BUSY') {
    return true;
  }
  if (!bot) return true;

  // --- 7) ابني الـ ctx ---
  // --- 7) Build the ctx ---
  const ctx = await buildContext(bot, message, { command: cmd, lang: found.lang, args, mentionId }, targetVc);
  if (!ctx.guild) return true;
  ctx.music.lang = 'en';
  settings.applyToMusic(ctx.music);

  // eval متسجّل عشان "!help eval" يشتغل، لكنه مبيشغّلش كود أبدًا.
  // eval is registered so "help eval" works, but it never runs code.
  if (cmd.name === 'eval') {
    await ctx.jerr('The eval command is disabled in this bot. It runs arbitrary code and is a security risk — see README-JMUSIC.md.');
    return true;
  }

  // --- 8) قيد روم الكتابة (settc) — أوامر الموسيقى في روم معيّن بس ---
  // --- 8) Text-channel restriction (settc) ---
  // لو اتظبط روم كتابة للموسيقى، أوامر الموسيقى بتشتغل فيه بس.
  // أوامر الأدمن والأونر والإعدادات مستثناة.
  // When a music text channel is set, music commands only work there.
  // Admin/Owner/settings commands are exempt.
  if (s.textChannelId && s.textChannelId !== '0' && message.channelId !== s.textChannelId && !cmd.admin && !cmd.owner && cmd.name !== 'settings') {
    await ctx.jwarn(`Music commands can only be used in <#${s.textChannelId}>!`);
    return true;
  }

  // --- 9) الصلاحيات — Permissions ---
  // الأونر بس / Manage Server / Administrator / DJ role.
  // Owner only / Manage Server / Administrator / DJ role.
  if (cmd.owner && !isOwner(ctx)) { await ctx.jerr('This command is for bot owners only.'); return true; }
  if (cmd.admin && !isAdmin(ctx)) { await ctx.jerr('This command needs the **Manage Server** permission.'); return true; }
  if (cmd.adminOnly && !isAdministrator(ctx)) { await ctx.jerr('This command needs the **Administrator** permission.'); return true; }
  if (cmd.dj && !isDJ(ctx)) { await ctx.jerr('You need the DJ role (or Manage Server) to use that!'); return true; }

  // --- 10) بوابة الصوت (للأوامر اللي محتاجة صوت) — Voice gate ---
  // --- 10) Voice gate (for voice commands) ---
  if (cmd.voice) {
    if (!targetVc) { await ctx.jerr('You must be in a voice channel to use that!'); return true; }
    const botVc = bot.voiceChannelId(ctx.guild.id);
    const pin = pins.get(bot.id, ctx.guild.id);
    // قاعدة البوت المثبت: البوت ده عايش في رومه المثبت فيه، وبيشتغل
    // بس للي معاه في نفس الروم — مش لحد في روم تاني.
    // (الأمر `ثبت` نفسه مستثنى — canMove — لأنه هو اللي بينقل البوت.)
    // Pinned-bot rule: this bot lives in its pinned channel and only
    // plays for someone in that same channel — never for another one.
    // (`ثبت` itself is exempt — canMove — because it moves the bot.)
    if (!cmd.canMove) {
      if (pin && pin.channelId !== targetVc) { await ctx.jerr(`This bot is pinned in <#${pin.channelId}>. Join that channel to use it.`); return true; }
      if (botVc && botVc !== targetVc) { await ctx.jerr(`This bot is busy in <#${botVc}>.`); return true; }
    }
    if (!botVc && !cmd.summon && !pin) { await ctx.jerr('There is no music playing right now!'); return true; }
    ctx.music.textChannelId = ctx.channel?.id || ctx.music.textChannelId;
  }

  // --- 11) شغّل الأمر — Run the command ---
  try {
    await cmd.run(ctx);
  } catch (e) {
    bot.log(`command "${cmd.name}" failed:`, e);
    // حوّل أكواد أخطاء الموسيقى لرسايل مفهومة (من i18n حسب لغة الأمر).
    // Map music error codes to user-friendly messages (i18n, by command language).
    const t = ctx.t;
    const map = { NO_NODE: t.noNode, NO_PERMS: t.noPerms, CHANNEL_FULL: t.channelFull, INVALID_CHANNEL: t.invalidChannel };
    if (e && map[e.code]) await ctx.jerr(map[e.code]);
    else await ctx.jerr('Something went wrong. Please try again.');
  }
  return true;
}

module.exports = { handle, claim, pickBot, buildContext, isOwner, isAdmin, isAdministrator, isDJ };
