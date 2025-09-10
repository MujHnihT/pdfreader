import { useCallback, useEffect, useState } from "react";
import { buildDownloadUrl } from "../utils/drive";
import { chapterDisplayName, chapterSlugFromName } from "../utils/title";

export default function useDriveChapters(folderId) {
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (token = null) => {
      if (!folderId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
          fields: "files(id,name,modifiedTime,size),nextPageToken",
          orderBy: "name_natural",
          pageSize: "100",
          key: import.meta.env.VITE_GOOGLE_API_KEY,
        });
        if (token) params.set("pageToken", token);

        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = (data.files || []).map((f) => {
          const displayName = chapterDisplayName(f.name);
          const slug = chapterSlugFromName(f.name);
          return {
            id: f.id,
            name: f.name,          // tên gốc
            displayName,           // tên hiển thị ngắn gọn
            slug,                  // slug cho URL
            url: buildDownloadUrl(f.id),
            size: f.size ? Number(f.size) : undefined,
            modifiedTime: f.modifiedTime,
          };
        });

        // gộp + sort
        setItems((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const c of mapped) map.set(c.id, c);
          return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" })
          );
        });

        setNextToken(data.nextPageToken || null);
        setError(null);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [folderId]
  );

  useEffect(() => {
    if (!folderId) return;
    setItems([]);
    setNextToken(null);
    setError(null);
    fetchPage(null);
  }, [folderId, fetchPage]);

  return { items, nextToken, error, loading, fetchNext: () => fetchPage(nextToken) };
}
