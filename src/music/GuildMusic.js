// ============================================================
//  music/GuildMusic.js — مشغّل الموسيقى لسيرفر واحد (Music player)
//  ------------------------------------------------------------
//  كل سيرفر ليه كائن GuildMusic خاص بيه (لكل بوت): القائمة، الأغنية
//  الحالية، السجل، التكرار، الصوت، الفلتر، ورسالة Now Playing.
//  بيتكلم مع NodeLink عن طريق Shoukaku (player).
//  One GuildMusic object per guild (per bot): the queue, the current
//  track, history, loop, volume, filter, and the Now Playing message.
//  It talks to NodeLink through Shoukaku (the player).
// ============================================================
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { config } = require('../config');
const pins = require('../store/pins');
const i18n = require('../i18n');
const embeds = require('../utils/embeds');
const { FILTERS } = require('./filters');
const { formatDuration, progressBar, truncate, escapeMd } = require('../utils/format');

// خطأ موسيقى بكود (NO_NODE / NO_PERMS / CHANNEL_FULL / INVALID_CHANNEL)
// عشان الراوتر يحوّله لرسالة مفهومة للمستخدم.
// A music error with a code, so the router can turn it into a
// user-friendly message.
class MusicError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// المدة الكلية بصيغة LunaBot: 03:35، أو 01:05:30 لو فيه ساعات.
// Total duration, LunaBot-style: 03:35, or 01:05:30 with hours.
function formatTotal(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${String(m).padStart(2, '0')}:${s}`;
}

// حالة الموسيقى لبوت واحد في سيرفر واحد
// Music state for one bot in one guild.
class GuildMusic {
  constructor(bot, guildId) {
    this.bot = bot;
    this.guildId = guildId;
    this.player = null; // مشغّل Shoukaku (NodeLink)
    this.queue = []; // الأغاني اللي جاية
    this.current = null; // الأغنية الشغالة دلوقتي
    this.history = []; // الأغاني اللي اتشغلت (آخر 50)
    this.loop = 'off'; // off | track | queue — التكرار
    this.queueType = 'fair'; // fair | linear — نوع القائمة
    this.volume = config.defaultVolume;
    this.filter = 'none';
    this.textChannelId = null;
    this.lang = 'ar';
    this.npMessage = null;
    this.idleTimer = null;
    this.emptyTimer = null;
    this.stopped = false;
    this.intentionalLeave = false;
    this.connecting = null;
  }

  // وضع التكرار بأسلوب JMusicBot: off | single | all
  // (loop الداخلي: off | track | queue).
  // RepeatMode, JMusicBot-style: off | single | all
  // (the internal loop is off | track | queue).
  get repeatMode() {
    return this.loop === 'track' ? 'single' : this.loop === 'queue' ? 'all' : 'off';
  }

  set repeatMode(mode) {
    this.loop = mode === 'single' ? 'track' : mode === 'all' ? 'queue' : 'off';
  }

  get guild() {
    return this.bot.client.guilds.cache.get(this.guildId) || null;
  }

  get t() {
    return i18n(this.lang);
  }

  get pinned() {
    return pins.get(this.bot.id, this.guildId);
  }

  get channelId() {
    return this.guild?.members.me?.voice?.channelId || null;
  }

  // هل المشغّل شغال فعلاً وموصول؟ — Is the player actually alive?
  get alive() {
    return !!this.player && this.bot.shoukaku.players.get(this.guildId) === this.player;
  }

  // حوّل تراك خام من NodeLink لعنصر قائمة موحّد (عنوان/مدة/لينك/طالب).
  // Turn a raw NodeLink track into a normalized queue item.
  makeItem(track, requesterId) {
    const info = track.info || {};
    return {
      encoded: track.encoded,
      title: info.title || 'Unknown',
      author: info.author || '',
      uri: info.uri || null,
      length: info.length || 0,
      isStream: !!info.isStream,
      isSeekable: !!info.isSeekable,
      artwork: info.artworkUrl || null,
      requesterId,
    };
  }

  // ===== الاتصال بالروم — Connecting to voice =====
  // لو فيه اتصال بيتم لنفس الروم، استنى نتيجته بدل ما تعمل اتصال تاني.
  // If a connect to the same channel is already in progress, wait for it.
  async connect(channelId) {
    if (this.alive && this.channelId === channelId) return this.player;
    if (this.connecting && this.connecting.channelId === channelId) return this.connecting.promise;

    const promise = this._connect(channelId);
    this.connecting = { channelId, promise };
    try {
      return await promise;
    } finally {
      if (this.connecting && this.connecting.promise === promise) this.connecting = null;
    }
  }

  async _connect(channelId) {
    const guild = this.guild;
    if (!guild) throw new MusicError('INVALID_CHANNEL');
    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased()) throw new MusicError('INVALID_CHANNEL');

    const me = guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms || !perms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
      throw new MusicError('NO_PERMS');
    }
    if (channel.full && !perms.has(PermissionFlagsBits.MoveMembers)) throw new MusicError('CHANNEL_FULL');
    if (!this.bot.shoukaku.getIdealNode()) throw new MusicError('NO_NODE');

    // لو متصل بروم تاني أو في اتصال قديم معلّق: اخرج الأول.
    // If connected elsewhere or a stale connection hangs: leave first.
    if (this.bot.shoukaku.connections.has(this.guildId) || this.bot.shoukaku.players.has(this.guildId)) {
      await this.leaveVoice();
      await sleep(1000);
    }

    this.bot.reserve(this.guildId, channelId);
    try {
      const player = await this.bot.shoukaku.joinVoiceChannel({
        guildId: this.guildId,
        channelId,
        shardId: guild.shardId,
        deaf: true,
      });
      this.intentionalLeave = false;
      this.attach(player);
      await player.setGlobalVolume(this.volume).catch(() => {});
      if (this.filter !== 'none' && FILTERS[this.filter]) await player.setFilters(FILTERS[this.filter]).catch(() => {});
      return player;
    } finally {
      this.bot.unreserve(this.guildId);
    }
  }

  // اربط أحداث المشغّل (بداية/نهاية/خطأ/تعليق) بالدوال المناسبة.
  // Wire the player events (start/end/exception/stuck) to handlers.
  attach(player) {
    if (this.player === player) return;
    this.player = player;
    player.on('start', () => {
      if (!config.npAuto) return; // رسالة Now Playing التلقائية مقفولة افتراضيًا
      this.sendNowPlaying().catch(() => {});
    });
    player.on('end', (data) => {
      if (this.player !== player) return;
      this.onEnd(data).catch((e) => this.bot.log('end handler error:', e.message));
    });
    player.on('exception', (data) => {
      const msg = data?.exception?.message;
      this.bot.log('track exception:', msg);
      this.sendText(this.t.trackError(msg ? truncate(msg, 150) : ''));
    });
    player.on('stuck', () => {
      this.bot.log('track stuck, skipping');
      if (this.player === player) player.stopTrack().catch(() => {});
    });
    player.on('closed', (data) => {
      this.bot.log(`voice websocket closed (${data?.code})`, data?.reason || '');
    });
  }

  async leaveVoice() {
    this.intentionalLeave = true;
    this.player = null;
    this.current = null;
    try {
      await this.bot.shoukaku.leaveVoiceChannel(this.guildId);
    } catch {
      /* ignore */
    }
  }

  // ===== التشغيل — Playback =====
  // ضيف أغاني للقائمة (في الأول لو front=true، وإلا في الآخر).
  // Add tracks to the queue (front when front=true, else at the end).
  add(items, front = false) {
    if (front) this.queue.unshift(...items);
    else this.queue.push(...items);
  }

  // شغّل اللي بعدها في القائمة، أو خلّص القائمة لو فاضية.
  // Play the next track, or finish the queue when it is empty.
  async next() {
    const item = this.queue.shift();
    if (!item) return this.onQueueEnd();
    return this.startTrack(item);
  }

  async startTrack(item) {
    if (!this.alive) {
      this.queue.unshift(item);
      return;
    }
    this.current = item;
    this.clearIdle();
    try {
      // من غير انتظار prebuffer — الأغنية بتبدأ فورًا.
      // No prebuffer wait — the track starts immediately.
      await this.player.playTrack({ track: { encoded: item.encoded } });
    } catch (e) {
      this.bot.log('playTrack failed:', e.message);
      this.current = null;
      this.sendText(this.t.trackError(truncate(item.title, 80)));
      return this.next();
    }
  }

  // لما أغنية تخلص: لو التكرار على الأغنية، عيدها. لو على القائمة،
  // رجّعها في الآخر. غير كدا شغّل اللي بعدها.
  // When a track ends: loop the track when loop=track, re-queue it
  // when loop=queue, otherwise play the next one.
  async onEnd(data) {
    const reason = data?.reason;
    if (reason === 'replaced' || reason === 'cleanup') return;
    const finished = this.current;
    this.current = null;
    if (finished) {
      if (this.loop === 'track' && reason === 'finished') {
        return this.startTrack(finished);
      }
      this.pushHistory(finished);
      if (this.loop === 'queue') this.queue.push(finished);
    }
    return this.next();
  }

  pushHistory(item) {
    this.history.push(item);
    if (this.history.length > 50) this.history.shift();
  }

  // لما القائمة تخلص: لو فيه بلاي ليست افتراضية للسيرفر، شغّلها.
  // لو مفيش، البوت بيفضل ساكت (من غير رسالة "القائمة خلصت").
  // When the queue ends: play the guild's default playlist when set.
  // Otherwise the bot stays silent (no "queue has ended" message).
  async onQueueEnd() {
    const wasStopped = this.stopped;
    this.stopped = false;
    this.disableNowPlaying();
    // بلاي ليست تلقائية: لما القائمة تخلص، شغّل البلاي ليست الافتراضية.
    // Autoplaylist: when the queue ends, play the default playlist.
    if (!wasStopped) {
      try {
        const settings = require('../store/settings');
        const s = settings.get(this.guildId);
        if (s.defaultPlaylist) {
          const { loadPlaylistItems } = require('./playback');
          const items = await loadPlaylistItems(this.bot, s.defaultPlaylist, null, this);
          if (items && items.length) {
            this.add(items);
            return this.next();
          }
        }
      } catch (e) {
        this.bot.log('autoplaylist failed:', e.message);
      }
    }
    if (!this.pinned) this.scheduleIdleLeave();
  }

  // تخطي الأغنية الحالية (بيوقف التراك، و onEnd بيكمل اللي بعدها).
  // Skip the current track (stops it; onEnd plays the next one).
  async skip() {
    if (!this.alive) return;
    await this.player.stopTrack();
  }

  // وقف فوري: امسح القائمة والأغنية الحالية. الرد مبيستناش
  // رد سيرفر الصوت (بحد أقصى 500ms) عشان الأمر يرد بسرعة.
  // Instant stop: clear the queue and the current track. The reply
  // doesn't wait for the audio server (max 500ms) so it answers fast.
  async stop() {
    this.queue = [];
    this.stopped = true;
    this.current = null;
    if (this.alive) await Promise.race([this.player.stopTrack().catch(() => {}), sleep(500)]);
  }

  // ارجع للأغنية اللي فاتت (من السجل).
  // Go back to the previous track (from history).
  async previous() {
    const prev = this.history.pop();
    if (!prev) return null;
    if (this.current) this.queue.unshift(this.current);
    await this.startTrack(prev);
    return prev;
  }

  // نط لأغنية رقم index في القائمة (اللي قبلها بتتشال).
  // Jump to track number index in the queue (earlier ones are dropped).
  async skipTo(index) {
    const removed = this.queue.splice(0, index - 1);
    if (this.loop === 'queue') this.queue.push(...removed);
    await this.skip();
  }

  // خلط القائمة كلها. — Shuffle the whole queue.
  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  // خلط عادل: خلّط أغاني مستخدم واحد بس، وسيب أغاني الباقيين مكانها.
  // Fair shuffle: only shuffle one user's tracks, leave the rest in place.
  shuffleFair(requesterId) {
    const idx = [];
    this.queue.forEach((it, i) => {
      if (it.requesterId === requesterId) idx.push(i);
    });
    const items = idx.map((i) => this.queue[i]);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    idx.forEach((pos, k) => {
      this.queue[pos] = items[k];
    });
    return items.length;
  }

  async setVolume(v) {
    this.volume = v;
    if (this.alive) await this.player.setGlobalVolume(v);
  }

  async setFilter(name) {
    this.filter = name;
    if (!this.alive) return;
    await this.player.setFilters(name === 'none' ? {} : FILTERS[name]);
  }

  // ===== الخروج التلقائي — Auto-leave =====
  clearIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  // جدوِل خروج بعد فترة الخمول (لو البوت مش متثبت ومفيش حاجة شغالة).
  // Schedule leaving after the idle delay (unpinned + nothing playing).
  scheduleIdleLeave() {
    this.clearIdle();
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (!this.current && !this.pinned && this.channelId) {
        this.sendText(this.t.leftIdle);
        this.destroy().catch(() => {});
      }
    }, config.leaveAfterMs);
  }

  // عدد البشر (مش البوتات) في روم البوت.
  // How many humans (not bots) are in the bot's channel.
  humansInChannel() {
    const ch = this.guild?.members.me?.voice?.channel;
    if (!ch) return 0;
    return ch.members.filter((m) => !m.user.bot).size;
  }

  // لو الروم فضي من البشر، جدوِل خروج بعد فترة الخمول.
  // When the channel empties of humans, schedule leaving after the delay.
  checkEmpty() {
    if (!this.channelId) return;
    if (this.humansInChannel() > 0) {
      if (this.emptyTimer) clearTimeout(this.emptyTimer);
      this.emptyTimer = null;
      return;
    }
    if (this.pinned || this.emptyTimer) return;
    this.emptyTimer = setTimeout(() => {
      this.emptyTimer = null;
      if (!this.pinned && this.channelId && this.humansInChannel() === 0) {
        this.sendText(this.t.leftEmpty);
        this.destroy().catch(() => {});
      }
    }, config.leaveAfterMs);
  }

  // امسح كل حاجة واخرج من الروم. — Clear everything and leave voice.
  async destroy() {
    this.clearIdle();
    if (this.emptyTimer) clearTimeout(this.emptyTimer);
    this.emptyTimer = null;
    this.queue = [];
    this.history = [];
    this.disableNowPlaying();
    await this.leaveVoice();
  }

  // البوت اتطرد أو اتفصل من الروم (مش بمزاجه).
  // The bot was kicked or disconnected (not on purpose).
  async handleDisconnect() {
    if (this.intentionalLeave) {
      this.intentionalLeave = false;
      return;
    }
    this.player = null;
    if (this.current) this.queue.unshift(this.current);
    this.current = null;
    this.clearIdle();
    this.disableNowPlaying();
    await this.bot.shoukaku.leaveVoiceChannel(this.guildId).catch(() => {});
    this.intentionalLeave = false;
    if (this.pinned) {
      setTimeout(() => this.bot.rejoinPin(this.guildId).catch(() => {}), 5000);
    } else {
      this.queue = [];
    }
  }

  // ===== الرسايل — Messages =====
  textChannel() {
    if (!this.textChannelId) return null;
    const ch = this.bot.client.channels.cache.get(this.textChannelId);
    return ch && ch.isTextBased() ? ch : null;
  }

  sendText(text) {
    const ch = this.textChannel();
    if (!ch) return;
    ch.send({ content: text }).catch(() => {});
  }

  // إمبيديد Now Playing بأسلوب LunaBot — بيطلعه أمر `الان` / nowplaying:
  //   Author: صورة واسم اللي طلب الأغنية (فوق)
  //   الوصف: <عنوان الأغنية>
  //          <⏸️/▶️> <شريط> [الوقت/المدة] 🔊 [الصوت]
  //   Footer: صورة واسم البوت
  // LunaBot-style Now Playing embed (from `الان` / nowplaying):
  //   Author: requester's avatar + username (top)
  //   Description: <title>
  //                <⏸️/▶️> <bar> [pos/total] 🔊 [vol]
  //   Footer: bot's avatar + username
  nowPlayingMessage() {
    const item = this.current;
    if (!item) return null;
    const pos = this.player?.position || 0;
    const paused = !!this.player?.paused;
    const volIcon = this.volume === 0 ? '🔇' : this.volume < 30 ? '🔈' : this.volume < 70 ? '🔉' : '🔊';
    const embed = embeds.base();
    const requester = item.requesterId
      ? (this.guild?.members.cache.get(item.requesterId)?.user || this.bot.client.users.cache.get(item.requesterId))
      : null;
    if (requester) embed.setAuthor({ name: requester.username, iconURL: requester.displayAvatarURL() });
    const title = truncate(item.title, 200);
    const line = item.isStream
      ? `🔴 LIVE ${volIcon} [${this.volume}]`
      : `${paused ? '▶️' : '⏸️'} ${progressBar(pos, item.length, 20)} [${formatDuration(pos)}/${formatTotal(item.length)}] ${volIcon} [${this.volume}]`;
    embed.setDescription(`<:music3:1575256248201515089> ${title}\n${line}`);
    const me = this.bot.client.user;
    if (me) embed.setFooter({ text: me.username, iconURL: me.displayAvatarURL() });
    return embed;
  }

  nowPlayingEmbed() {
    return this.nowPlayingMessage() || embeds.info(this.t.nothingPlaying);
  }

  // أزرار رسالة Now Playing (بتتعالج في src/buttons.js).
  // Now Playing buttons (handled in src/buttons.js).
  buildButtons() {
    const paused = !!this.player?.paused;
    const btn = (id, emoji, style = ButtonStyle.Secondary) =>
      new ButtonBuilder().setCustomId(`music:${id}`).setEmoji(emoji).setStyle(style);
    return [
      new ActionRowBuilder().addComponents(
        btn('previous', '⏮️'),
        btn('pause', paused ? '▶️' : '⏸️', ButtonStyle.Primary),
        btn('skip', '⏭️'),
        btn('stop', '⏹️', ButtonStyle.Danger),
        btn('loop', this.loop === 'track' ? '🔂' : '🔁', this.loop === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
      ),
      new ActionRowBuilder().addComponents(
        btn('shuffle', '🔀'),
        btn('voldown', '🔉'),
        btn('volup', '🔊'),
        btn('queue', '📜'),
      ),
    ];
  }

  // ابعت رسالة Now Playing (لو NP_AUTO مفعّلة) وحدّثها كل 5 ثواني.
  // Send the Now Playing message (when NP_AUTO is on), refreshing every 5s.
  async sendNowPlaying() {
    const ch = this.textChannel();
    const msg = this.nowPlayingMessage();
    if (!ch || !msg) return;
    this.disableNowPlaying();
    try {
      this.npMessage = await ch.send({ embeds: [msg] });
      this.npTimer = setInterval(() => this.refreshNowPlaying(), 5000);
      this.npTimer.unref?.();
    } catch {
      this.npMessage = null;
    }
  }

  refreshNowPlaying() {
    if (!this.npMessage || !this.current) return;
    const msg = this.nowPlayingMessage();
    if (!msg) return;
    this.npMessage.edit({ embeds: [msg] }).catch(() => {});
  }

  disableNowPlaying() {
    if (this.npTimer) { clearInterval(this.npTimer); this.npTimer = null; }
    this.npMessage = null;
  }
}

// صورة مصغّرة لفيديو يوتيوب (مش مستخدمة حاليًا، محفوظة للاستخدام المستقبلي).
// YouTube thumbnail URL (unused for now, kept for future use).
function ytThumb(uri) {
  if (!uri) return null;
  const m = String(uri).match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

module.exports = { GuildMusic, MusicError };
