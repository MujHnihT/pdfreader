const KEY = "pdf-reader:chapterIndex:session";

/** Lấy toàn bộ index trong sessionStorage */
export function getAllSessionIndex() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Ghi toàn bộ index vào sessionStorage */
export function setAllSessionIndex(obj) {
  sessionStorage.setItem(KEY, JSON.stringify(obj));
}

/** Lưu index cho 1 truyện theo storySlug */
export function saveSessionIndex(storySlug, chapters) {
  const all = getAllSessionIndex();
  all[storySlug] = {
    updatedAt: Date.now(),
    chapters: chapters.map((c) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      slug: c.slug,
    })),
  };
  setAllSessionIndex(all);
}

/** Lấy index 1 truyện */
export function getSessionIndex(storySlug) {
  const all = getAllSessionIndex();
  return all[storySlug] || null;
}
