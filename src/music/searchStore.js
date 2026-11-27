// ============================================================
//  searchStore.js — مخزن نتائج البحث (Search results store)
//  ------------------------------------------------------------
//  أمر `بحث` بيعرض النتايج في قائمة منسدلة، ولما المستخدم يختار
//  أغنية لازم البوت يفتكر التراك اللي ورا الاختيار ده. المخزن ده
//  بيحفظ نتايج كل بحث (10 تراكات) بمفتاح قصير، والقائمة بتشيل
//  المفتاح في الـ customId بتاعها (music:search:<id>).
//  النتيجة بتتمسح لوحدها بعد 60 ثانية (أو بعد أول اختيار) عشان
//  المخزن ميكبرش.
//  The `بحث` command shows results in a dropdown, and when the user
//  picks a song the bot needs to remember which track that choice
//  was. This store keeps each search's results (10 tracks) under a
//  short key, carried in the menu's customId (music:search:<id>).
//  An entry is deleted after 60 seconds (or after the first pick)
//  so the store never grows.
// ============================================================

const store = new Map();

function saveSearch(tracks, query, authorId) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  store.set(id, { tracks, query, authorId, createdAt: Date.now() });
  setTimeout(() => store.delete(id), 60000);
  return id;
}

function getSearch(id) {
  return store.get(id) || null;
}

function deleteSearch(id) {
  store.delete(id);
}

module.exports = { saveSearch, getSearch, deleteSearch };
