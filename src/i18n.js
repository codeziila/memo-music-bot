// ============================================================
//  i18n.js — كل رسايل البوت بالعربي والإنجليزي (All bot messages)
//  ------------------------------------------------------------
//  البوت بيرد بنفس لغة الأمر اللي اتكتب: لو كتبت الأمر بالعربي
//  (مثال: `انتظار`) الرد بيكون عربي، ولو بالإنجليزي (مثال: `pause`)
//  الرد بيكون إنجليزي. الأوامر الجديدة (بأسلوب JMusicBot) بترد
//  إنجليزي على طول، ودي الرسايل بتاعتها في الكود نفسه.
//  The bot answers in the same language the command was typed in:
//  Arabic command ➜ Arabic reply, English command ➜ English reply.
//  The newer (JMusicBot-style) commands answer in English, and their
//  messages live in the command files themselves.
//  عشان تضيف رسالة جديدة: زوّدها هنا بالعربي والإنجليزي بنفس الاسم.
//  To add a message: add it here in Arabic and English with the same key.
//  (الإيموجيز music1/music3 اللي في filterTitle/filterCurrent من
//  config.emojis — آيديهاتهم من .env، شوف config.js.)
// ============================================================
const { config } = require('./config');

const ar = {
  joinVoiceFirst: 'لازم تدخل روم صوتي الأول.',
  notInMyChannel: (ch) => `لازم تكون معايا في <#${ch}>.`,
  botBusy: (ch) => `البوت ده مشغول في <#${ch}>.`,
  allBusy: 'كل البوتات مشغولة دلوقتي. ادخل روم فيه بوت أو استنى لحد ما بوت يفضى.',
  noNode: 'سيرفر لافا لينك مش متصل دلوقتي، جرّب كمان شوية.',
  noPerms: 'معنديش صلاحية أدخل أو أتكلم في الروم ده.',
  channelFull: 'الروم الصوتي مليان.',
  invalidChannel: 'الروم ده مش روم صوتي صحيح.',
  error: 'حصل خطأ غير متوقع، جرّب تاني.',
  nothingPlaying: 'مفيش حاجة شغالة دلوقتي.',
  queueEmpty: 'القائمة فاضية.',
  needManage: 'الأمر ده محتاج صلاحية **إدارة السيرفر**.',
  ownerOnly: 'الأمر ده لأصحاب البوت بس.',
  invalidNumber: 'اكتب رقم صحيح.',

  playUsage: 'اكتب اسم الأغنية أو اللينك. مثال: `شغل عمرو دياب`',
  noResults: 'مالقيتش نتايج.',
  loadFailed: (m) => `فشل تحميل الأغنية${m ? `: ${m}` : '.'}`,
  queueFull: (n) => `القائمة وصلت للحد الأقصى (${n} أغنية).`,
  addedTrack: (title, pos) => `✅ اتضافت **${title}** في القائمة (رقم ${pos}).`,
  addedPlaylist: (name, n) => `✅ اتضافت قائمة **${name}** (${n} أغنية).`,

  nowPlaying: 'شغال دلوقتي',
  requestedBy: 'طلبها',
  duration: 'المدة',
  live: 'بث مباشر',
  artist: 'الفنان',
  loopLabel: 'التكرار',
  volumeLabel: 'الصوت',
  inQueue: 'في القائمة',
  loopModes: { off: 'مقفول', track: 'الأغنية', queue: 'القائمة' },

  paused: '⏸️ وقفت التشغيل مؤقتًا.',
  alreadyPaused: 'التشغيل واقف أصلاً.',
  resumed: '▶️ كمّلت التشغيل.',
  notPaused: 'التشغيل مش واقف.',
  skipped: (title) => `⏭️ اتخطيت **${title}**.`,
  stopped: '⏹️ وقفت التشغيل ومسحت القائمة.',
  previousNone: 'مفيش أغنية قبل كده.',
  previousPlaying: (title) => `⏮️ رجعت لـ **${title}**.`,
  replayed: '🔄 الأغنية بدأت من الأول.',

  queueTitle: 'قائمة التشغيل',
  queueNow: 'دلوقتي',
  queueNext: 'الجاي',
  queueFooter: (p, ps, n, total) => `صفحة ${p}/${ps} • ${n} أغنية • المدة الكلية ${total}`,

  volumeNow: (v) => `🔊 الصوت دلوقتي **${v}%**.`,
  volumeSet: (v) => `🔊 الصوت بقى **${v}%**.`,
  volumeRange: (max) => `الصوت لازم يكون من 0 لـ ${max}.`,

  loopSet: (mode) => `🔁 التكرار: **${mode}**.`,
  shuffled: (n) => `🔀 خلطت ${n} أغنية.`,
  notEnough: 'محتاج أغنيتين على الأقل في القائمة.',

  seekUsage: 'اكتب الوقت. مثال: `تقديم 1:30` أو `تقديم +10` أو `تقديم -10`',
  notSeekable: 'الأغنية دي مينفعش تتقدم.',
  seeked: (time) => `⏩ روحت لـ **${time}**.`,

  removeUsage: 'اكتب رقم الأغنية في القائمة. مثال: `احذف 3`',
  removed: (title) => `🗑️ اتشالت **${title}** من القائمة.`,
  moveUsage: 'اكتب رقم الأغنية والمكان الجديد. مثال: `نقل 5 1`',
  moved: (title, pos) => `↕️ **${title}** بقت رقم ${pos}.`,
  cleared: (n) => `🧹 اتمسحت ${n} أغنية من القائمة.`,
  skiptoUsage: 'اكتب رقم الأغنية. مثال: `انتقل 4`',
  skippedTo: (title) => `⏭️ نطيت لـ **${title}**.`,

  joined: (ch) => `✅ دخلت <#${ch}>.`,
  alreadyHere: 'أنا موجود معاك أصلاً.',
  left: '👋 خرجت من الروم.',
  pinnedCantLeave: 'البوت ده متثبت في الروم. اكتب `فك التثبيت` الأول.',

  pinned: (ch) => `📌 البوت اتثبت في <#${ch}> وهيفضل فيه 24/7 حتى بعد الريستارت.`,
  channelTaken: (id) => `الروم ده متثبت فيه بوت تاني (<@${id}>).`,
  unpinned: '📍 اتلغى التثبيت. البوت هيخرج لو الروم فضي أو القائمة خلصت.',
  notPinned: 'البوت ده مش متثبت.',
  pinAll: (list) => `📌 اتثبت كل بوت في رومه:\n${list}`,
  pinAllNone: 'مفيش بوتات موجودة في رومات صوتية دلوقتي عشان أثبتها.',
  unpinAll: (n) => `📍 اتلغى تثبيت ${n} بوت.`,

  filterUsage: (list) => `اختار فلتر: ${list}\nأو \`فلتر الغاء\` عشان ترجع الصوت عادي.`,
  filterSet: (name) => `🎛️ اتفعل فلتر **${name}**.`,
  filterReset: '🎛️ اتشالت كل الفلاتر.',
  filterTitle: `${config.emojis.music1} فلاتر الصوت`,
  filterPick: 'اختار فلتر…',
  filterCurrent: (name) => `${config.emojis.music3} الفلتر الحالي: **${name}**`,
  filterNone: 'بدون فلتر',
  filterOff: 'إيقاف الفلتر',

  searchTitle: (q) => `نتايج البحث عن: ${q}`,
  searchPick: 'اختار أغنية…',
  searchFooter: 'معاك 30 ثانية تختار.',
  searchTimeout: 'خلص الوقت.',

  botsTitle: 'حالة البوتات',
  botPlaying: (ch) => `🎶 شغال في <#${ch}>`,
  botIdle: (ch) => `💤 موجود في <#${ch}>`,
  botFree: '🟢 فاضي',
  botPinnedTag: (ch) => `📌 متثبت في <#${ch}>`,

  pong: (ws, nodes) => `🏓 بنج: **${ws}ms**\nلافا لينك: ${nodes}`,
  nodeUp: 'متصل',
  nodeDown: 'مش متصل',

  setnameUsage: 'اكتب الاسم الجديد. مثال: `اسم بوت الأغاني`',
  nameChanged: (n) => `✅ الاسم اتغير لـ **${n}**.`,
  avatarUsage: 'ابعت لينك صورة أو ارفع صورة مع الأمر.',
  avatarChanged: '✅ الصورة اتغيرت.',
  profileFailed: (m) => `فشل التغيير: ${m}`,

  queueEnded: '✅ القائمة خلصت.',
  leftIdle: '👋 خرجت عشان مفيش حاجة شغالة.',
  leftEmpty: '👋 خرجت عشان الروم فضي.',
  trackError: (m) => `⚠️ مشكلة في تشغيل الأغنية${m ? `: ${m}` : ''}. هشغل اللي بعدها.`,
  nodeLost: '⚠️ الاتصال بسيرفر لافا لينك وقع. شغّل الأغنية تاني بعد ما يرجع.',

  helpTitle: 'أوامر البوت',
  helpFooter: 'من غير بريفكس • اكتب الأمر بالعربي أو الإنجليزي • ممكن تمنشن بوت معين قبل الأمر',
};

const en = {
  joinVoiceFirst: 'Join a voice channel first.',
  notInMyChannel: (ch) => `You need to be with me in <#${ch}>.`,
  botBusy: (ch) => `This bot is busy in <#${ch}>.`,
  allBusy: 'All bots are busy right now. Join a channel that has a bot, or wait for one to be free.',
  noNode: 'The Lavalink server is not connected right now. Try again shortly.',
  noPerms: "I don't have permission to join or speak in that channel.",
  channelFull: 'That voice channel is full.',
  invalidChannel: 'That is not a valid voice channel.',
  error: 'Something went wrong. Please try again.',
  nothingPlaying: 'Nothing is playing right now.',
  queueEmpty: 'The queue is empty.',
  needManage: 'This command needs the **Manage Server** permission.',
  ownerOnly: 'This command is for bot owners only.',
  invalidNumber: 'Enter a valid number.',

  playUsage: 'Type a song name or link. Example: `play never gonna give you up`',
  noResults: 'No results found.',
  loadFailed: (m) => `Failed to load the track${m ? `: ${m}` : '.'}`,
  queueFull: (n) => `The queue is full (${n} tracks).`,
  addedTrack: (title, pos) => `✅ Added **${title}** to the queue (#${pos}).`,
  addedPlaylist: (name, n) => `✅ Added playlist **${name}** (${n} tracks).`,

  nowPlaying: 'Now playing',
  requestedBy: 'Requested by',
  duration: 'Duration',
  live: 'Live',
  artist: 'Artist',
  loopLabel: 'Loop',
  volumeLabel: 'Volume',
  inQueue: 'In queue',
  loopModes: { off: 'Off', track: 'Track', queue: 'Queue' },

  paused: '⏸️ Paused.',
  alreadyPaused: 'Already paused.',
  resumed: '▶️ Resumed.',
  notPaused: 'Playback is not paused.',
  skipped: (title) => `⏭️ Skipped **${title}**.`,
  stopped: '⏹️ Stopped and cleared the queue.',
  previousNone: 'There is no previous track.',
  previousPlaying: (title) => `⏮️ Back to **${title}**.`,
  replayed: '🔄 Restarted the track.',

  queueTitle: 'Queue',
  queueNow: 'Now',
  queueNext: 'Up next',
  queueFooter: (p, ps, n, total) => `Page ${p}/${ps} • ${n} tracks • Total ${total}`,

  volumeNow: (v) => `🔊 Volume is **${v}%**.`,
  volumeSet: (v) => `🔊 Volume set to **${v}%**.`,
  volumeRange: (max) => `Volume must be between 0 and ${max}.`,

  loopSet: (mode) => `🔁 Loop: **${mode}**.`,
  shuffled: (n) => `🔀 Shuffled ${n} tracks.`,
  notEnough: 'You need at least 2 tracks in the queue.',

  seekUsage: 'Give a time. Example: `seek 1:30`, `seek +10` or `seek -10`',
  notSeekable: 'This track cannot be seeked.',
  seeked: (time) => `⏩ Seeked to **${time}**.`,

  removeUsage: 'Give the track number. Example: `remove 3`',
  removed: (title) => `🗑️ Removed **${title}**.`,
  moveUsage: 'Give the track number and new position. Example: `move 5 1`',
  moved: (title, pos) => `↕️ Moved **${title}** to #${pos}.`,
  cleared: (n) => `🧹 Cleared ${n} tracks.`,
  skiptoUsage: 'Give the track number. Example: `skipto 4`',
  skippedTo: (title) => `⏭️ Jumped to **${title}**.`,

  joined: (ch) => `✅ Joined <#${ch}>.`,
  alreadyHere: "I'm already here with you.",
  left: '👋 Left the channel.',
  pinnedCantLeave: 'This bot is pinned to the channel. Use `unpin` first.',

  pinned: (ch) => `📌 Pinned to <#${ch}>. I will stay there 24/7, even after restarts.`,
  channelTaken: (id) => `Another bot is already pinned to this channel (<@${id}>).`,
  unpinned: '📍 Unpinned. I will leave when the channel is empty or the queue ends.',
  notPinned: 'This bot is not pinned.',
  pinAll: (list) => `📌 Pinned every bot to its channel:\n${list}`,
  pinAllNone: 'No bots are in voice channels right now, so there is nothing to pin.',
  unpinAll: (n) => `📍 Unpinned ${n} bots.`,

  filterUsage: (list) => `Pick a filter: ${list}\nOr \`filter reset\` to go back to normal.`,
  filterSet: (name) => `🎛️ Filter **${name}** enabled.`,
  filterReset: '🎛️ All filters removed.',
  filterTitle: `${config.emojis.music1} Audio Filters`,
  filterPick: 'Choose a filter…',
  filterCurrent: (name) => `${config.emojis.music3} Current filter: **${name}**`,
  filterNone: 'No filter',
  filterOff: 'Turn off filter',

  searchTitle: (q) => `Search results for: ${q}`,
  searchPick: 'Pick a track…',
  searchFooter: 'You have 30 seconds to pick.',
  searchTimeout: 'Time is up.',

  botsTitle: 'Bot status',
  botPlaying: (ch) => `🎶 Playing in <#${ch}>`,
  botIdle: (ch) => `💤 In <#${ch}>`,
  botFree: '🟢 Free',
  botPinnedTag: (ch) => `📌 Pinned to <#${ch}>`,

  pong: (ws, nodes) => `🏓 Ping: **${ws}ms**\nLavalink: ${nodes}`,
  nodeUp: 'connected',
  nodeDown: 'disconnected',

  setnameUsage: 'Give the new name. Example: `setname Music Bot`',
  nameChanged: (n) => `✅ Name changed to **${n}**.`,
  avatarUsage: 'Send an image link or attach an image with the command.',
  avatarChanged: '✅ Avatar changed.',
  profileFailed: (m) => `Change failed: ${m}`,

  queueEnded: '✅ The queue has ended.',
  leftIdle: '👋 Left because nothing was playing.',
  leftEmpty: '👋 Left because the channel was empty.',
  trackError: (m) => `⚠️ Could not play the track${m ? `: ${m}` : ''}. Moving to the next one.`,
  nodeLost: '⚠️ Lost connection to Lavalink. Play the track again once it is back.',

  helpTitle: 'Bot commands',
  helpFooter: 'No prefix • Arabic or English • You can mention a specific bot before the command',
};

const dict = { ar, en };
module.exports = (lang) => dict[lang] || ar;
