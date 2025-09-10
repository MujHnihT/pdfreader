// Bỏ đuôi .pdf (không phân biệt hoa/thường)
export function stripPdfExt(name = "") {
  return name.replace(/\.pdf$/i, "");
}

/**
 * Lấy tên chương gọn để hiển thị:
 * - Bỏ .pdf
 * - Cắt trước dấu phân cách: " - ", " – ", " — ", ":", "|"
 */
export function chapterDisplayName(raw = "") {
  const noExt = stripPdfExt(String(raw).trim());
  const firstPart = noExt.split(/\s*[-–—:|]\s*/)[0] || noExt;
  return firstPart.trim();
}

/** Tạo slug từ display name (dùng cho URL nếu cần) */
export function chapterSlugFromName(raw = "") {
  const base = chapterDisplayName(raw)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "chuong";
}
