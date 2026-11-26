# 🎵 Memo Music Bot

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/codeziila/memo-music-bot/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-blue)](https://discord.js.org/)
[![Audio](https://img.shields.io/badge/audio-NodeLink-orange)](https://github.com/PerformanC/NodeLink)

A self-hosted Discord music bot that plays from **YouTube by name**. No prefix — just type.
One process runs **many bots** from a single tokens file, each pinned to its own voice channel.

## ✨ Features

- **Play by name from YouTube** (`ytsearch`) — full video titles, no links needed
- **YouTube → SoundCloud auto-fallback** — if YouTube blocks the server IP, the bot retries from SoundCloud automatically and returns to YouTube on its own when the block lifts
- **SoundCloud & Spotify** — search and play by name, or paste a link (Spotify links resolve to the best YouTube audio match)
- **No prefix** — bare commands (`play`, `skip`, `queue`…) in English and Arabic
- **Multi-bot** — one `tokens.txt` runs many bots; each bot is pinned to its own voice channel and only answers users in that channel
- **Audio filters with a dropdown picker** — bassboost, nightcore, vaporwave, 8D, karaoke, slow, speed, tremolo
- **Queue, loop (on/off), volume, seek, shuffle, lyrics, history, playlists** (local `.txt` files)
- **Sky-blue embeds** for replies, per-server settings & pins saved to disk
- **Help via DM** — permission-filtered, never posted in a public channel

## 📋 Requirements

- **Node.js v20 or higher**
- A **Discord bot token** — create one at the [Discord Developer Portal](https://discord.com/developers/applications). One token per bot; put them in `tokens.txt`.
- A running **[NodeLink](https://github.com/PerformanC/NodeLink) server** (v3.10+, port `3000`) — self-hosted or public. The bot connects to it via Shoukaku.
- **MESSAGE CONTENT INTENT** enabled for your bot in the Developer Portal (the bot reads message text to match bare commands). Without it, the bot will not reply.

## 🚀 Installation

**Prerequisites:** [Node.js v20+](https://nodejs.org/) and [Git](https://git-scm.com/downloads).

### Linux / macOS

```bash
git clone https://github.com/codeziila/memo-music-bot.git
cd memo-music-bot
npm install
cp .env.example .env          # fill in your values (see below)
cp tokens.example.txt tokens.txt   # one Discord bot token per line
npm start
```

To keep the bot running after you close the terminal (e.g. on a VPS):

```bash
nohup npm start > bot.log 2>&1 &
```

### Windows

In **PowerShell** (`cp` works there):

```powershell
git clone https://github.com/codeziila/memo-music-bot.git
cd memo-music-bot
npm install
cp .env.example .env          # fill in your values (see below)
cp tokens.example.txt tokens.txt   # one Discord bot token per line
npm start
```

In **Command Prompt (cmd)**, use `copy` instead of `cp`:

```cmd
copy .env.example .env
copy tokens.example.txt tokens.txt
```

To keep the bot running in the background on Windows, use [PM2](https://pm2.keymetrics.io/):

```powershell
npm install -g pm2
pm2 start npm --name "music-bot" -- start
```

> Start NodeLink **before** the bot (see [NodeLink setup](#nodelink-setup)). The bot logs in, connects to the node, and each bot rejoins its pinned voice channel.

## ⚙️ Configuration

### `.env`

| Variable | Description | Required |
|---|---|---|
| `LAVALINK_NODES` | Audio nodes, format `name\|host:port\|password\|secure`, separate multiple with `;` | yes |
| `OWNER_IDS` | Discord user IDs of bot owners, comma-separated (Owner commands) | yes |
| `DEFAULT_SEARCH` | Default search source (`ytsearch`) | no |
| `DEFAULT_VOLUME` | Default volume, 0–150 (default `100`) | no |
| `MAX_VOLUME` | Max allowed volume (default `150`) | no |
| `MAX_QUEUE` | Max queue size (default `500`) | no |
| `LEAVE_AFTER_SECONDS` | Idle-leave delay for unpinned bots (default `120`) | no |
| `JMUSIC_PREFIXES` | Optional per-bot prefixes to target one bot (default: no prefix) | no |
| `JMUSIC_PLAYLISTS_FOLDER` | Local playlists folder (default `Playlists`) | no |

Example:

```env
LAVALINK_NODES=main|localhost:3000|youshallnotpass|false
OWNER_IDS=your_discord_user_id
DEFAULT_VOLUME=100
```

> ⚠️ **Change the NodeLink password** (`youshallnotpass` is only the well-known default). Never share your real `.env` or `tokens.txt` — anyone with a token controls that bot.

### `tokens.txt` — the only place for bot tokens

One Discord bot token per line. Lines starting with `#` are ignored. One token = one bot.

```
# one token per line
PASTE_BOT_TOKEN_1_HERE
PASTE_BOT_TOKEN_2_HERE
```

### NodeLink setup

1. Install [NodeLink](https://github.com/PerformanC/NodeLink) (Node.js v20+).
2. Copy its `config.default.ts` to `config.ts`.
3. For YouTube, put your **TV OAuth refresh token** in `sources.youtube.clients.settings.TV.refreshToken` (an array). This keeps YouTube working — without it YouTube rate-limits the server IP quickly. Set `sources.youtube.getOAuthToken: false` once the token is in place.
4. Start NodeLink on port `3000` (default password `youshallnotpass` — change it and match it in `.env`).

## 📌 Getting started — pin the bot first

The bot only works in the voice channel it is pinned to. Before anything else, pin it:

1. **Join the voice channel** you want music in.
2. **Pin the bot there** — type `pin` in the text channel (needs the Manage Server permission), or mention the bot to pin that specific one:
   ```
   @Bot pin
   ```
   The bot joins your voice channel and stays there 24/7, even after restarts.
3. **That's it.** Now just type a command (no prefix) while you are in that voice channel:
   ```
   play <song name>
   ```

> ⚠️ **The bot only listens to people in its own voice channel.** If you are in a different voice channel — or not in voice at all — the bot ignores your commands. Each bot is pinned to one voice channel; to use another bot, join that bot's channel.

- `unpin` — remove the bot from the channel.
- `pinall` — pin every bot to the voice channel it is currently in.
- `pin <channel>` — pin the bot to a different voice channel by name or mention.

## 🎮 Commands

No prefix. Type the command in the voice channel's text channel while you are in that bot's pinned voice channel. Both Arabic and English work.

### Music

| Command | Description |
|---|---|
| `play <name\|URL>` | Play a song by name (YouTube) or a link |
| `playnext <name\|URL>` | Play next in the queue |
| `search <query>` | Search YouTube and pick a result |
| `scsearch <query>` | Search SoundCloud by name |
| `spsearch <query>` | Search Spotify by name |
| `skip` | Skip the current track |
| `forceskip` | Force-skip (DJ) |
| `stop` | Stop and leave the voice channel |
| `pause` | Pause |
| `resume` | Resume |
| `queue [page]` | Show the queue |
| `nowplaying` | Now playing |
| `history [page]` | Playback history |
| `remove <n\|ALL>` | Remove a track from the queue |
| `forceremove <user>` | Remove a user's tracks (DJ) |
| `skipto <n>` | Jump to a queue position (DJ) |
| `movetrack <from> <to>` | Move a track (DJ) |
| `shuffle` | Shuffle the queue |
| `volume [0-150]` | Set / show volume (DJ) |
| `repeat [on\|off]` | Loop the current track on/off (DJ) |
| `seek [+/-] <time>` | Seek within the track |
| `previous` | Play the previous track |
| `replay` | Replay the current track |
| `lyrics` | Lyrics of the current track |
| `filter [name]` | Open the filter picker, or apply a filter directly |
| `join` | Join your voice channel |
| `leave` | Leave the voice channel |
| `playlists` | Local playlists |

### Admin (Manage Server / DJ)

| Command | Description |
|---|---|
| `pin` | Pin this bot to your voice channel (24/7) |
| `unpin` | Unpin the bot |
| `pinall` / `unpinall` | Pin / unpin all bots |
| `bots` | List all bots and their status |
| `restart [all]` | Restart this bot, or all bots |
| `settings` | Server settings |
| `setdj` | Set the DJ role |
| `settc` | Set the text channel |
| `setvc` | Set the voice channel |
| `queuetype` | Queue behaviour |
| `prefix` | Per-bot prefix |

### Owner only

| Command | Description |
|---|---|
| `setname <name>` | Change the bot's username |
| `setavatar <url>` | Change the bot's avatar |
| `setgame <text>` | Change the bot's status |
| `setstatus <text>` | Change the bot's status text |
| `shutdown` | Shut the bot down |
| `debug` | Debug info |
| `eval <code>` | Evaluate JS (dangerous — owner only) |
| `clearchannel` | Clear channel messages |
| `autoplaylist` | Auto-playlist settings |
| `playlist` | Manage local playlists |

### General

| Command | Description |
|---|---|
| `help` | Help, sent by DM (permission-filtered) |
| `ping` | Bot latency |
| `about` | About the bot |

> **Mention rule:** by mention, only `restart` and `pin` work (`@Bot restart`). Any other mentioned command is ignored.
> **Help privacy:** if your DMs are closed, the bot only posts a short notice in-channel — the help content is never posted publicly.

## 📁 Project Structure

```
memo-music-bot/
├── src/
│   ├── index.js            # entry point — starts one bot per token
│   ├── config.js           # loads .env + tokens.txt
│   ├── bot.js              # multi-bot bootstrap
│   ├── router.js           # command routing (no prefix)
│   ├── permissions.js      # owner / admin checks
│   ├── i18n.js             # Arabic + English strings
│   ├── buttons.js          # buttons / select menus (filter picker)
│   ├── commands/           # one file per command, grouped
│   │   ├── music/  admin/  owner/  general/
│   ├── music/              # GuildMusic.js, playback.js, filters.js
│   ├── store/              # settings.js, pins.js (read/write data/)
│   └── utils/              # embeds.js, format.js, arabic.js
├── Playlists/              # local playlists (example.txt)
├── .env.example
├── tokens.example.txt
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## 🐛 Troubleshooting

- **Bot doesn't reply** → enable **MESSAGE CONTENT INTENT** in the Developer Portal, and make sure you are in that bot's **pinned voice channel** (a bot only answers users in its own channel).
- **Music doesn't play** → is NodeLink running? Check `LAVALINK_NODES` (host, port `3000`, password) and that the node shows as connected in the bot log.
- **YouTube blocked / 429** → the bot falls back to SoundCloud automatically. To fix YouTube, refresh the YouTube TV OAuth token in NodeLink's `config.ts`.
- **High latency (`ping` shows 300ms+)** → usually the host, not the bot: check the server's CPU load. Voice/music is a separate connection and is not affected by gateway latency.
- **Filter picker emojis don't render** → the picker uses custom Discord emojis (`music1` / `music2` / `music3`). Replace their IDs in `src/commands/music/filter.js` with your own server's emoji IDs. The picker still works without them.

## 🤝 Contributing

Pull requests are welcome. Open an issue first for big changes.

## 📝 License

MIT — see [LICENSE](LICENSE).

## 🙏 Credits

- [discord.js](https://discord.js.org/) — Discord API library
- [Shoukaku](https://github.com/Deivu/Shoukaku) — Lavalink/NodeLink client
- [NodeLink](https://github.com/PerformanC/NodeLink) — audio server
- [Lavalink](https://github.com/lavalink-devs/Lavalink) — the original audio server this design is based on
