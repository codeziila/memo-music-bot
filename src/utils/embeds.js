// ============================================================
//  embeds.js — مساعدات الإمبيديد (Embed helpers)
//  ------------------------------------------------------------
//  كل ردود البوت إمبيديد بلون سماوي واحد (#7EA6D8 — لون شعار Sky).
//  All bot replies are embeds in one sky-blue color (#7EA6D8 — Sky logo blue).
//  اللون متثبّت في config.js (embedColor / errorColor) ومش بيتغير من .env.
//  The color is hardcoded in config.js and never read from .env.
// ============================================================
const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');

module.exports = {
  // إمبيديد عادي (للردود الناجحة والتحذيرات).
  // Normal embed (success + warning replies).
  info(text) {
    return new EmbedBuilder().setColor(config.embedColor).setDescription(String(text).slice(0, 4096));
  },

  // إمبيديد خطأ — بيضيف ❌ في الأول.
  // Error embed — adds a ❌ at the start.
  error(text) {
    return new EmbedBuilder().setColor(config.errorColor).setDescription(`❌ ${String(text).slice(0, 4000)}`);
  },

  // إمبيديد فاضي للتخصيص (عنوان + حقول + فوتر).
  // Blank embed to customize (title + fields + footer).
  base() {
    return new EmbedBuilder().setColor(config.embedColor);
  },
};
