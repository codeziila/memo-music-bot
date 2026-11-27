// ============================================================
//  filter.js — أمر الفلاتر الصوتية (Audio Filter command)
//  ------------------------------------------------------------
//  فلتر / فلاتر / تاثير / filter
//  ------------------------------------------------------------
//  بيحط فلتر صوتي على الأغنية اللي شغالة (باس، نايتكور، 8D،
//  بطيء، سريع، كاريوكي...). اكتب اسم الفلتر، أو "فلتر off"
//  عشان تلغيه. لو كتبت "فلتر" لوحدها، هيطلع إمبيديد فيه قائمة
//  منسدلة (Dropdown) تختار منها الفلتر بضغطة — زي الصورة.
//  (الأمر ده من الطبقة القديمة، فبيرد بالعربي أو الإنجليزي
//  حسب لغة الأمر — عن طريق ctx.t.)
//  Applies an audio filter to the song playing now (bassboost,
//  nightcore, 8d, slow, speed, karaoke...). Type the filter name,
//  or "فلتر off" to remove it. A bare "فلتر" shows an embed with
//  a Dropdown menu to pick the filter with one click.
//  (This command comes from the old layer, so it replies in Arabic or
//  English depending on the command's language — via ctx.t.)
// ============================================================
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { FILTERS, NAMES_AR, resolveFilter } = require('../../music/filters');
const embeds = require('../../utils/embeds');
const i18n = require('../../i18n');
const { config } = require('../../config');

// إيموجيات السكاي بتاعت البوت (music1/2/3) — بتتحط في القائمة المنسدلة
// والإمبيديد بدل الإيموجيات العادية، عشان الشكل يبقى بهوية البوت.
// آيديهاتهم من .env (EMOJI_MUSIC*_ID) — شوف config.js.
// The bot's sky emojis (music1/2/3) — used in the Dropdown and the
// embed instead of plain Unicode emojis, for the bot's sky identity.
// Their IDs come from .env (EMOJI_MUSIC*_ID) — see config.js.
const SKY = {
  music1: { id: config.emojis.music1Id, name: 'music1' },
  music2: { id: config.emojis.music2Id, name: 'music2' },
  music3: { id: config.emojis.music3Id, name: 'music3' },
};

// بيانات العرض لكل فلتر (إيموجي سكاي + وصف مختصر).
// الإيموجيات بتلف music1 ➜ music2 ➜ music3 عشان الشكل يبقى متناسق.
// Display data for each filter (sky emoji + short description).
// Emojis cycle music1 ➜ music2 ➜ music3 for a consistent look.
const FILTER_META = {
  bassboost: { emoji: SKY.music2, descAr: 'تقوية الباس', descEn: 'Boost the bass' },
  nightcore: { emoji: SKY.music3, descAr: 'أسرع ونغمة أعلى', descEn: 'Faster + higher pitch' },
  vaporwave: { emoji: SKY.music1, descAr: 'أبطأ ونغمة أوطى', descEn: 'Slower + lower pitch' },
  '8d': { emoji: SKY.music2, descAr: 'صوت بيلف حواليك', descEn: 'Rotating 3D sound' },
  karaoke: { emoji: SKY.music3, descAr: 'إزالة صوت المغني', descEn: 'Remove vocals' },
  slow: { emoji: SKY.music1, descAr: 'أبطأ', descEn: 'Slower' },
  speed: { emoji: SKY.music2, descAr: 'أسرع', descEn: 'Faster' },
  tremolo: { emoji: SKY.music3, descAr: 'تأثير الاهتزاز', descEn: 'Trembling effect' },
};

// ابني إمبيديد الفلاتر + القائمة المنسدلة (Dropdown).
// "الصوت العادي" (إيقاف الفلتر) أول اختيار، مش آخر واحد.
// اللي شغال دلوقتي بيبقى متعلّم عليه (default) في القائمة.
// Build the filter picker embed + Dropdown menu.
// "Normal sound" (turn off) is the FIRST option, not the last.
// The currently active filter is marked as default in the menu.
function buildFilterPicker(music, lang) {
  const t = i18n(lang);
  const current = music?.filter && music.filter !== 'none' ? music.filter : null;
  const currentName = current ? (lang === 'ar' ? NAMES_AR[current] : current) : t.filterNone;

  // أول اختيار: الصوت العادي (إيقاف الفلتر).
  // First option: normal sound (turn the filter off).
  const options = [{
    label: t.filterOff,
    value: 'none',
    description: lang === 'ar' ? 'رجّع الصوت عادي' : 'Back to normal sound',
    emoji: SKY.music1,
    default: !current,
  }];
  for (const key of Object.keys(FILTERS)) {
    const meta = FILTER_META[key] || {};
    options.push({
      label: lang === 'ar' ? NAMES_AR[key] : key,
      value: key,
      description: lang === 'ar' ? meta.descAr : meta.descEn,
      emoji: meta.emoji,
      default: current === key,
    });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('music:filter')
    .setPlaceholder(t.filterPick)
    .addOptions(options);

  const embed = embeds
    .base()
    .setTitle(t.filterTitle)
    .setDescription(`${t.filterCurrent(currentName)}\n\n👇 ${t.filterPick}`);

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

module.exports = {
  name: 'filter',
  aliases: ['fx'],
  ar: ['فلتر', 'فلاتر', 'تاثير'],
  category: 'Music',
  args: '<name|off>',
  help: 'applies an audio filter',
  voice: true,
  buildFilterPicker,

  async run(ctx) {
    const { music, t } = ctx;
    const name = resolveFilter(ctx.args.join(' '));
    const list = Object.keys(FILTERS)
      .map((k) => (ctx.lang === 'ar' ? `\`${NAMES_AR[k]}\`` : `\`${k}\``))
      .join(' • ');
    // "فلتر" لوحدها: إمبيديد + قائمة منسدلة تختار منها.
    // Bare "فلتر": embed + Dropdown menu to pick from.
    if (!name) {
      if (!music.alive) return ctx.err(t.nothingPlaying);
      return ctx.send(buildFilterPicker(music, ctx.lang));
    }
    if (!music.alive) return ctx.err(t.nothingPlaying);
    if (name === 'reset') {
      await music.setFilter('none');
      return ctx.ok(t.filterReset);
    }
    await music.setFilter(name);
    return ctx.ok(t.filterSet(ctx.lang === 'ar' ? NAMES_AR[name] : name));
  },
};
