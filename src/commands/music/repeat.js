// ============================================================
//  repeat.js — أمر التكرار (Repeat command)
//  ------------------------------------------------------------
//  تكرار / كرر / لوب / repeat (وكمان loop بالإنجليزي)
//  ------------------------------------------------------------
//  التكرار هنا on/off بس — مفيش تكرار للقائمة كلها.
//  • "تكرار on" (أو فعل / تشغيل): بيعيد الأغنية الحالية للأبد
//    (لحد ما توقفها أو تخطّيها).
//  • "تكرار off" (أو الغاء / وقف): بيوقف التكرار.
//  • "تكرار" لوحدها: بتبدّل بين on و off.
//  • "تكرار all" أو "تكرار القائمه": بيطلع خطأ — التكرار on/off بس.
//  Repeat is ON/OFF only — there is no whole-queue repeat.
//  • "تكرار on" (or فعل / تشغيل): loops the CURRENT song forever
//    (until you stop it or skip it).
//  • "تكرار off" (or الغاء / وقف): stops repeating.
//  • Bare "تكرار": toggles between on and off.
//  • "تكرار all" or "تكرار القائمه": errors — repeat is on/off only.
// ============================================================
const settings = require('../../store/settings');

module.exports = {
  name: 'repeat',
  aliases: ['loop'],
  ar: ['تكرار', 'كرر', 'لوب'],
  category: 'DJ',
  args: '[on|off]',
  help: 'repeats the current song in a loop (on) or stops repeating (off)',
  voice: true,
  dj: true,

  async run(ctx) {
    const { music } = ctx;
    const a = (ctx.args[0] || '').toLowerCase();
    // on/off بس — اللي يكتب all أو queue أو القائمه بيطلع له خطأ.
    // On/off only — typing all / queue / القائمه is an error.
    if (a === 'all' || a === 'queue' || a === 'قائمه' || a === 'القائمه' || a === 'الكل' || a === 'كل') return ctx.jerr('Repeat is now `on` or `off` only — `on` loops the current song.');
    const map = { on: 'single', off: 'off', single: 'single', track: 'single', one: 'single', 'فعل': 'single', 'تشغيل': 'single', 'الغاء': 'off', 'وقف': 'off', 'لا': 'off' };
    let mode = map[a];
    if (!mode) mode = music.repeatMode === 'off' ? 'single' : 'off';
    music.repeatMode = mode;
    settings.update(ctx.guild.id, { repeatMode: mode });
    music.refreshNowPlaying();
    const name = mode === 'single' ? 'On' : 'Off';
    return ctx.jok(`Repeat mode set to **${name}**.`);
  },
};
