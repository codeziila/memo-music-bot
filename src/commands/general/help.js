// ============================================================
//  help.js — أمر المساعدة (Help command)
//  ------------------------------------------------------------
//  مساعده / الاوامر / help
//  ------------------------------------------------------------
//  بيعرض قائمة الأوامر — بس الأوامر اللي المستخدم يقدر يشغّلها
//  (فلترة حسب الصلاحيات). بتتبعت في رسالة خاصة (DM) على جزئين،
//  ولو الـ DM مقفول، بيبعت تنبيه مرة واحدة في الروم بس —
//  والمساعدة نفسها مبتتبعتش في العام أبدًا.
//  Shows the command list — only the commands this user can run
//  (permission-filtered). Sent by DM in 2 parts; when DMs are closed,
//  it posts one notice in the channel only — the help itself is NEVER
//  posted publicly.
//  العنوان فيه رقم النسخة من package.json (بيتحدّث مع كل نسخة جديدة).
//  The title includes the version from package.json (follows every bump).
// ============================================================
const { version: botVersion } = require('../../../package.json');
const { isOwner, isAdmin, isAdministrator, isDJ } = require('../../permissions');

module.exports = {
  name: 'help',
  aliases: ['commands'],
  ar: ['مساعده', 'الاوامر', 'اوامر', 'هيلب'],
  category: 'General',
  args: '[command]',
  help: 'shows the help for a command, or lists all commands',

  async run(ctx) {
    // القائمة الموحّدة — بنجيبها هنا (مش فوق) عشان نتجنب الـ circular
    // require (commands/index.js بيحمّل الملف ده).
    // The unified list — required here (not at the top) to avoid a
    // circular require (commands/index.js loads this file).
    const { commands, lookupCommand } = require('../index');

    // لو الـ DM مقفول، بنقول كده مرة واحدة في الروم ومبنبعتش
    // المساعدة في الشات العام أبدًا — لازم يفتح الـ DM الأول.
    // If their DMs are closed, tell them ONCE in the channel and do NOT
    // post the help in the public chat — they must open their DMs first.
    let dmSent = false;
    let dmWarned = false;
    const sendDM = async (content) => {
      try { return await ctx.author.send({ content }); } catch { return null; }
    };
    const sendHelp = async (content) => {
      // الأول DM. ولو الـ DM مقفول، بنقول كده مرة واحدة في الروم
      // وبنرجّع null — المساعدة نفسها مبتتبعتش في العام أبدًا.
      // Prefer DM. If the user's DMs are closed, tell them once in the
      // channel and return null — the help itself is NEVER posted publicly.
      const dm = await sendDM(content);
      if (dm) { dmSent = true; return dm; }
      if (!dmWarned) {
        dmWarned = true;
        await ctx.send({ content: '⚠️ I could not send you a DM — your DMs are closed. Please open your DMs and try again.' }).catch(() => {});
      }
      return null;
    };
    const reactOk = async () => {
      if (dmSent) await ctx.message.react('✅').catch(() => {});
    };

    // هل المستخدم ده يقدر يشغّل الأمر ده؟ (عشان نخفي اللي مش ليه)
    // Can this user run this command? (so we hide what isn't theirs)
    const canRun = (c) => {
      if (c.owner && !isOwner(ctx)) return false;
      if (c.adminOnly && !isAdministrator(ctx)) return false;
      if (c.admin && !isAdmin(ctx)) return false;
      if (c.dj && !isDJ(ctx)) return false;
      return true;
    };

    // --- مساعدة أمر معيّن: "مساعده شغل" / "help play" ---
    // --- Help for one command: "مساعده شغل" / "help play" ---
    if (ctx.args.length) {
      const found = lookupCommand(ctx.args);
      if (!found) return ctx.jerr(`There is no command named \`${ctx.args[0]}\`.`);
      const c = found.cmd;
      if (!canRun(c)) return ctx.jerr('You do not have permission to use that command.');
      const al = c.aliases || [];
      const arAliases = c.ar || [];
      const m = await sendHelp(
        `**${c.name}${c.args ? ` ${c.args}` : ''}**\n${c.help}` +
          (al.length ? `\nAliases: ${al.map((a) => `\`${a}\``).join(', ')}` : '') +
          (arAliases.length ? `\nبالعربي: ${arAliases.map((a) => `\`${a}\``).join(', ')}` : ''),
      );
      await reactOk();
      return m;
    }

    // --- القائمة الكاملة (جزئين) — The full list (2 parts) ---
    const MUSIC_EMOJI = '<:music1:1575256281277534308>';
    const HELP_EMOJI = '<:music2:1575256198654201897>';
    const name = ctx.bot.client.user.username;
    const line = (c) => `\`${c.name}${c.args ? ` ${c.args}` : ''}\` - ${c.help}`;
    const section = (g, label, emoji) => {
      const all = commands.filter((c) => c.category === g && canRun(c)).map(line);
      if (!all.length) return '';
      return (label ? `${emoji ? emoji + ' ' : ''}${label}:\n` : '') + all.join('\n');
    };
    const footer = `© Mimo (w2hm_) — All rights reserved. This source belongs to Memo.`;

    // الجزء 1: العنوان + عامة + موسيقى. الجزء 2: DJ + أدمن + أونر + تثبيت + التذييل.
    // Part 1: title + General + Music. Part 2: DJ + Admin + Owner + Pin & Bots + footer.
    const p1 = [];
    p1.push(`${HELP_EMOJI} ${name} commands (v${botVersion}):`);
    const gen = section('General', '', '');
    if (gen) p1.push(gen);
    const mus = section('Music', 'Music', MUSIC_EMOJI);
    if (mus) p1.push(mus);

    const p2 = [];
    const dj = section('DJ', 'DJ', '');
    if (dj) p2.push(dj);
    const adm = section('Admin', 'Admin', '');
    if (adm) p2.push(adm);
    const own = section('Owner', 'Owner', '');
    if (own) p2.push(own);
    const pin = section('Pin', 'Pin & Bots', HELP_EMOJI);
    if (pin) p2.push(pin);
    p2.push(footer);

    await sendHelp(p1.join('\n\n'));
    const m2 = await sendHelp(p2.join('\n\n'));
    await reactOk();
    return m2;
  },
};
