export function stripPdfExt(name = "") {
  return name.replace(/\.(pdf|txt|docx)$/i, "");
}

export function chapterDisplayName(raw = "") {
  const noExt = stripPdfExt(String(raw).trim());
  const firstPart = noExt.split(/\s*[-–—:|]\s*/)[0] || noExt;
  return firstPart.trim();
}

export function chapterSlugFromName(raw = "") {
  const base = chapterDisplayName(raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "chuong";
}
