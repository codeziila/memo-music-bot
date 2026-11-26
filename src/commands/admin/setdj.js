// ============================================================
//  setdj.js — أمر تحديد رول الـ DJ (Set DJ Role command)
//  ------------------------------------------------------------
//  دي جي / حدد دي جي / رول دي جي / setdj
//  ------------------------------------------------------------
//  بيحدد أنهو رول في السيرفر يقدر يستخدم أوامر الـ DJ
//  (إيقاف، وقف، صوت، تكرار، شغل بعدها...).
//  • "دي جي DJ" — الرول اللي اسمه DJ هو الـ DJ.
//  • "دي جي @everyone" — الكل يقدر يستخدم أوامر الـ DJ.
//  • "دي جي NONE" — بيلغي الرول؛ أوامر الـ DJ بتحتاج Manage Server.
//  (الأمر ده للمشرفين Manage Server بس.)
//  Sets which role in the server can use the DJ commands
//  (pause, stop, volume, repeat, playnext...).
//  • "دي جي DJ" — the role named DJ becomes the DJ role.
//  • "دي جي @everyone" — everyone can use DJ commands.
//  • "دي جي NONE" — clears the role; DJ commands need Manage Server.
//  (Manage Server only.)
// ============================================================
const settings = require('../../store/settings');
const { truncate, escapeMd } = require('../../utils/format');

function roleFromArg(guild, arg) {
  if (!arg) return null;
  const id = arg.replace(/[<@&>]/g, '');
  let role = guild.roles.cache.get(id);
  if (!role) role = guild.roles.cache.find((r) => r.name.toLowerCase() === arg.toLowerCase());
  return role || null;
}

module.exports = {
  name: 'setdj',
  aliases: [],
  ar: ['دي جي', 'حدد دي جي', 'رول دي جي'],
  category: 'Admin',
  args: '<rolename|NONE>',
  help: 'sets the DJ role for certain music commands',
  admin: true,

  async run(ctx) {
    const arg = ctx.args.join(' ').trim();
    if (!arg) return ctx.jerr('You must include a role! Example: `!setdj DJ` or `!setdj NONE`');
    if (arg.toUpperCase() === 'NONE') {
      settings.update(ctx.guild.id, { djRoleId: '0' });
      return ctx.jok('DJ role cleared. DJ commands now need Manage Server.');
    }
    if (arg.toLowerCase() === 'everyone' || arg === '@everyone') {
      settings.update(ctx.guild.id, { djRoleId: ctx.guild.id });
      return ctx.jok('DJ role set to **@everyone** — anyone can use DJ commands.');
    }
    const role = roleFromArg(ctx.guild, arg);
    if (!role) return ctx.jerr(`Could not find a role named \`${escapeMd(truncate(arg, 60))}\`!`);
    settings.update(ctx.guild.id, { djRoleId: role.id });
    return ctx.jok(`DJ role set to **${escapeMd(role.name)}**.`);
  },
};
