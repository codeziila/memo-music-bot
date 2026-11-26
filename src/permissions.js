// ============================================================
//  permissions.js — دوال الصلاحيات (Permission helpers)
//  ------------------------------------------------------------
//  مين يقدر يعمل إيه في البوت — 4 مستويات:
//  • Owner: صاحب البوت (Mimo) — الأوامر الخاصة بيه بس.
//  • Admin: اللي عنده Manage Server، أو صاحب السيرفر.
//  • Administrator: اللي عنده Administrator (مش بس Manage Server)
//    — لأمر restart بس.
//  • DJ: صاحب البوت، أو أدمن، أو اللي معاه رول الـ DJ.
//  Who can do what in the bot — 4 levels:
//  • Owner: the bot owner (Mimo) — Owner commands only.
//  • Admin: has Manage Server, or owns the guild.
//  • Administrator: has Administrator (not just Manage Server)
//    — for the restart command only.
//  • DJ: bot owner, admin, or holder of the DJ role.
//  ------------------------------------------------------------
//  الملف ده مستقل (مبيستوردش الراوتر ولا الأوامر) — عشان الراوتر
//  وملف المساعدة (help.js) يقدروا يستخدموه من غير circular dependency.
//  This file is standalone (it imports neither the router nor the
//  commands) — so the router and help.js can both use it without
//  a circular dependency.
// ============================================================
const { PermissionFlagsBits } = require('discord.js');
const { config } = require('./config');
const settings = require('./store/settings');

// صاحب البوت (Mimo) — Bot owner.
function isOwner(ctx) {
  return config.ownerIds.includes(ctx.author.id);
}

// أدمن: عنده Manage Server، أو صاحب السيرفر.
// Admin: has Manage Server, or owns the guild.
function isAdmin(ctx) {
  return ctx.member?.permissions?.has(PermissionFlagsBits.ManageGuild) || ctx.guild?.ownerId === ctx.author.id;
}

// Administrator (مش بس Manage Server) — لأمر restart.
// Administrator (not just Manage Server) — for the restart command.
function isAdministrator(ctx) {
  return ctx.member?.permissions?.has(PermissionFlagsBits.Administrator) || ctx.guild?.ownerId === ctx.author.id;
}

// DJ: صاحب البوت، أو أدمن، أو معاه رول الـ DJ.
// DJ: bot owner, admin, or holder of the DJ role.
// لو مفيش رول DJ متظبط (أو الـ role هو @everyone)، الكل DJ.
// When no DJ role is set (or it is @everyone), everyone is a DJ.
function isDJ(ctx) {
  if (isOwner(ctx) || isAdmin(ctx)) return true;
  const s = settings.get(ctx.guild.id);
  if (!s.djRoleId || s.djRoleId === '0') return false;
  if (s.djRoleId === ctx.guild.id) return true; // @everyone = الكل DJ
  return !!ctx.member?.roles?.cache?.has(s.djRoleId);
}

module.exports = { isOwner, isAdmin, isAdministrator, isDJ };
