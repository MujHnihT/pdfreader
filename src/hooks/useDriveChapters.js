import { useCallback, useEffect, useRef, useState } from "react";
import { buildDownloadUrl } from "../utils/drive";
import { chapterDisplayName, chapterSlugFromName } from "../utils/title";

/**
 * Hook tải danh sách chương trong 1 folder.
 * - fetchFirstPage(): chỉ tải 1 trang đầu (UI dùng)
 * - prefetchAllMeta(): tải ngầm toàn bộ danh sách chapter (id, name, displayName, slug)
 * - fetchNext(): nếu vẫn muốn tải thêm từng trang cho UI
 */
export default function useDriveChapters(folderId) {
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prefetching, setPrefetching] = useState(false);

  const apiKey = useRef(import.meta.env.VITE_GOOGLE_API_KEY);

  const mapFiles = useCallback((files = []) => {
    return files.map((f) => {
      const displayName = chapterDisplayName(f.name);
      const slug = chapterSlugFromName(f.name);
      return {
        id: f.id,
        name: f.name,
        displayName,
        slug,
        url: buildDownloadUrl(f.id),
        size: f.size ? Number(f.size) : undefined,
        modifiedTime: f.modifiedTime,
      };
    });
  }, []);

  const mergeSort = useCallback((prev, incoming) => {
    const map = new Map(prev.map((c) => [c.id, c]));
    for (const c of incoming) map.set(c.id, c);
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" })
    );
  }, []);

  const fetchPage = useCallback(
    async (token = null) => {
      if (!folderId) return { files: [], nextPageToken: null };
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
        fields: "files(id,name,modifiedTime,size),nextPageToken",
        orderBy: "name_natural",
        pageSize: "100",
        key: apiKey.current,
      });
      if (token) params.set("pageToken", token);

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [folderId]
  );

  /** Chỉ tải 1 trang đầu cho UI */
  const fetchFirstPage = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const data = await fetchPage(null);
      const mapped = mapFiles(data.files || []);
      setItems(mapped);
      setNextToken(data.nextPageToken || null);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [folderId, fetchPage, mapFiles]);

  /** Tải thêm 1 trang (nếu UI muốn “Tải thêm”) */
  const fetchNext = useCallback(async () => {
    if (!folderId || !nextToken) return;
    setLoading(true);
    try {
      const data = await fetchPage(nextToken);
      const mapped = mapFiles(data.files || []);
      setItems((prev) => mergeSort(prev, mapped));
      setNextToken(data.nextPageToken || null);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [folderId, nextToken, fetchPage, mapFiles, mergeSort]);

  /**
   * Prefetch NGẦM toàn bộ chapters (không ảnh hưởng UI).
   * Trả về mảng chapters đã map (id, name, displayName, slug).
   */
  const prefetchAllMeta = useCallback(async () => {
    if (!folderId) return [];
    setPrefetching(true);
    try {
      let token = null;
      let all = [];
      do {
        const data = await fetchPage(token);
        const mapped = mapFiles(data.files || []);
        all = mergeSort(all, mapped);
        token = data.nextPageToken || null;
      } while (token);
      return all;
    } catch (e) {
      // không đẩy error lên UI
      console.error("prefetchAllMeta error:", e);
      return [];
    } finally {
      setPrefetching(false);
    }
  }, [folderId, fetchPage, mapFiles, mergeSort]);

  // Reset khi đổi folder
  useEffect(() => {
    setItems([]);
    setNextToken(null);
    setError(null);
  }, [folderId]);

  return {
    items,
    nextToken,
    error,
    loading,
    prefetching,
    fetchFirstPage,
    fetchNext,
    prefetchAllMeta,
  };
}
