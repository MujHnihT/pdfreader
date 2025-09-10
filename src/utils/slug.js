export function toSlug(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]+/g, "-")                      // non-word -> -
    .replace(/(^-|-$)/g, "");                         // trim -
}
