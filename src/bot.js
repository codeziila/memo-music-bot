// ============================================================
//  bot.js — بوت واحد (One bot instance)
//  ------------------------------------------------------------
//  كل توكن في tokens.txt بيعمل كائن BotInstance: اتصال ديسكورد خاص
//  بيه، واتصال NodeLink خاص بيه، وحالة موسيقى لكل سيرفر.
//  بوت واحد = توكن واحد + اتصال NodeLink خاص بيه.
//  One token in tokens.txt = one BotInstance: its own Discord client,
//  its own NodeLink connection, and per-guild music state.
// ============================================================
const { Client, GatewayIntentBits, Partials, Options, ActivityType, Events } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const { config, defaultBotPrefix } = require('./config');
const pins = require('./store/pins');
const { GuildMusic } = require('./music/GuildMusic');
const router = require('./router');
const { handleButton, handleFilterSelect, handleSearchSelect } = require('./buttons');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class BotInstance {
  constructor(token, index) {
    this.token = token;
    this.index = index;
    this.ready = false;
    this.music = new Map(); // guildId ➜ GuildMusic
    this.reservations = new Map(); // حجز مؤقت لروم (عشان بوتين ميروحوش لنفس الطلب)
    this.rejoinAttempts = new Map(); // عدّاد محاولات الرجوع للروم المثبت

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 25,
        PresenceManager: 0,
        ReactionManager: 0,
      }),
      allowedMentions: { parse: [], repliedUser: true },
    });

    // اتصال NodeLink (عن طريق Shoukaku) — NodeLink connection via Shoukaku.
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), config.nodes, {
      moveOnDisconnect: false,
      resume: false,
      reconnectTries: 10,
      reconnectInterval: 5,
      restTimeout: 60,
    });

    this.bindEvents();
  }

  get id() {
    return this.client.user?.id || null;
  }

  get label() {
    return `Bot#${this.index + 1}${this.client.user ? ` ${this.client.user.tag}` : ''}`;
  }

  // بريفكس البوت ده (الأول "!"، التاني "!2"، ...) — بيتغيّر بأمر prefix
  // أو من JMUSIC_PREFIXES في .env.
  // This bot's own prefix (Bot#1 "!", Bot#2 "!2", ...) — changeable
  // with the prefix command, or JMUSIC_PREFIXES in .env.
  getPrefix(guildId) {
    try {
      const settings = require('./store/settings');
      return settings.botPrefix(guildId, this.id, this.index);
    } catch {
      return defaultBotPrefix(this.index);
    }
  }

  log(...args) {
    console.log(`[${this.label}]`, ...args);
  }

  start() {
    return this.client.login(this.token);
  }

  // هات (أو اعمل) حالة الموسيقى لسيرفر معيّن.
  // Get (or create) the music state for a guild.
  getMusic(guildId, create = true) {
    let m = this.music.get(guildId);
    if (!m && create) {
      m = new GuildMusic(this, guildId);
      this.music.set(guildId, m);
    }
    return m || null;
  }

  // الروم الصوتي اللي البوت فيه دلوقتي في سيرفر معيّن (أو null).
  // The voice channel this bot is in for a guild (or null).
  voiceChannelId(guildId) {
    return this.client.guilds.cache.get(guildId)?.members.me?.voice?.channelId || null;
  }

  // حجز مؤقت عشان بوتين ميروحوش لنفس الطلب في نفس اللحظة.
  // Temporary reservation so two bots don't jump on the same request.
  reserve(guildId, channelId) {
    this.reservations.set(guildId, { channelId, at: Date.now() });
  }

  unreserve(guildId) {
    this.reservations.delete(guildId);
  }

  // الروم اللي البوت فيه أو رايح له دلوقتي.
  // The channel the bot is in, or heading to right now.
  targetChannel(guildId) {
    const vc = this.voiceChannelId(guildId);
    if (vc) return vc;
    const r = this.reservations.get(guildId);
    if (r && Date.now() - r.at < 20000) return r.channelId;
    return null;
  }

  // ارجع للروم المثبت فيه في سيرفر معيّن (بعد ريستارت أو فصل).
  // Rejoin the pinned channel in a guild (after a restart or disconnect).
  async rejoinPin(guildId) {
    const pin = pins.get(this.id, guildId);
    if (!pin) return;
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return;
    const music = this.getMusic(guildId);
    if (this.voiceChannelId(guildId) === pin.channelId && music.alive) return;
    if (pin.textChannelId && !music.textChannelId) music.textChannelId = pin.textChannelId;
    try {
      await music.connect(pin.channelId);
      this.rejoinAttempts.delete(guildId);
      this.log(`rejoined pinned channel ${pin.channelId} in ${guild.name}`);
      if (!music.current && music.queue.length) await music.next();
    } catch (e) {
      if (e.code === 'INVALID_CHANNEL') {
        this.log(`pinned channel ${pin.channelId} no longer exists, removing pin`);
        pins.remove(this.id, guildId);
        return;
      }
      const n = (this.rejoinAttempts.get(guildId) || 0) + 1;
      this.rejoinAttempts.set(guildId, n);
      this.log(`rejoin failed (${e.code || e.message}), attempt ${n}`);
      if (n < 10) setTimeout(() => this.rejoinPin(guildId).catch(() => {}), 15000 * n);
    }
  }

  // ارجع لكل الرومات المثبت فيها (عند التشغيل).
  // Rejoin every pinned channel (on startup).
  async restorePins() {
    for (const { guildId } of pins.forBot(this.id)) {
      await this.rejoinPin(guildId).catch(() => {});
      await sleep(1000);
    }
  }

  // ريستارت للبوت ده بس (أمر `@Bot restart`): دمّر اتصال ديسكورد
  // وسجّل دخول تاني. الـ ready handler بيرجع الـ presence والروومات
  // المثبتة لوحده.
  // Restart just this bot (`@Bot restart`): destroy its Discord client
  // and log it back in. The ready handler restores the presence and the
  // pinned channels by itself.
  async restartClient() {
    try { await this.client.destroy(); } catch (e) { /* already down */ }
    await this.client.login(this.token);
    // ارجع للرومات المثبتة فورًا — الـ ready handler بيعملها كمان،
    // بس NodeLink ممكن ميكونش جاهز لما ready يضرب، فبنعملها هنا صراحة.
    // (rejoinPin بيعيد المحاولة لو NodeLink مش جاهز، فمفيش مشكلة.)
    // Rejoin the pinned channels right away. The ready handler does
    // this too, but the audio node may not be ready when ready fires —
    // so do it explicitly here as well.
    await sleep(2000);
    await this.restorePins().catch(() => {});
  }

  bindEvents() {
    const c = this.client;

    c.on(Events.ClientReady, () => {
      this.ready = true;
      this.log(`ready in ${c.guilds.cache.size} servers`);
      this.log(
        `invite: https://discord.com/oauth2/authorize?client_id=${c.user.id}&permissions=3230720&scope=bot`,
      );
      // الحالة عند التشغيل: Streaming "By Memo" (متثبّتة في config.js).
      // Startup presence: Streaming "By Memo" (hardcoded in config.js).
      c.user.setPresence({ activities: [{ name: config.status, type: ActivityType.Streaming, url: 'https://www.twitch.tv/memo' }], status: 'online' });
      // ارجع للرومات المثبتة على طول (حتى بعد re-login من ريستارت).
      // Always restore pins on ready (incl. re-login after a restart).
      this.restorePins().catch(() => {});
    });

    c.on(Events.MessageCreate, (message) => {
      router.handle(this, message).catch((e) => this.log('message handler error:', e));
    });

    c.on(Events.InteractionCreate, (interaction) => {
      if (interaction.isButton() && interaction.customId.startsWith('music:')) {
        handleButton(this, interaction).catch((e) => this.log('button error:', e.message));
      } else if (interaction.isStringSelectMenu() && interaction.customId === 'music:filter') {
        handleFilterSelect(this, interaction).catch((e) => this.log('filter select error:', e.message));
      } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('music:search:')) {
        handleSearchSelect(this, interaction).catch((e) => this.log('search select error:', e.message));
      }
    });

    c.on(Events.VoiceStateUpdate, (oldState, newState) => {
      const guildId = newState.guild.id;
      const music = this.getMusic(guildId, false);
      if (newState.id === c.user.id) {
        if (oldState.channelId && !newState.channelId) {
          if (music) music.handleDisconnect().catch(() => {});
          else if (pins.get(this.id, guildId)) setTimeout(() => this.rejoinPin(guildId).catch(() => {}), 5000);
        } else if (music && newState.channelId) {
          music.checkEmpty();
        }
        return;
      }
      const mine = this.voiceChannelId(guildId);
      if (music && mine && (oldState.channelId === mine || newState.channelId === mine)) music.checkEmpty();
    });

    c.on(Events.GuildDelete, (guild) => {
      this.music.delete(guild.id);
    });

    c.on(Events.Error, (e) => this.log('client error:', e.message));

    this.shoukaku.on('ready', (name, reconnected) => {
      this.log(`audio node "${name}" ${reconnected ? 'reconnected' : 'connected'}`);
      if (this.ready) this.restorePins().catch(() => {});
    });
    this.shoukaku.on('error', (name, error) => this.log(`audio node "${name}" error:`, error?.message || error));
    this.shoukaku.on('close', (name, code, reason) => this.log(`audio node "${name}" closed: ${code} ${reason || ''}`));
    this.shoukaku.on('disconnect', (name) => {
      this.log(`audio node "${name}" disconnected`);
      for (const music of this.music.values()) {
        if (music.player && music.player.node && music.player.node.name === name) {
          const wasPinned = !!music.pinned;
          if (!wasPinned) music.sendText(music.t.nodeLost);
          music.player = null;
          music.current = null;
          music.disableNowPlaying();
          if (!wasPinned) music.destroy().catch(() => {});
        }
      }
    });
  }
}

module.exports = BotInstance;
