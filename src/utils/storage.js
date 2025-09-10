const STORAGE_KEY = "pdf-reader:lastPages";

export function getLastPages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setLastPages(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function rememberPage(docId, page) {
  const current = getLastPages();
  current[docId] = page;
  setLastPages(current);
}

export { STORAGE_KEY };
