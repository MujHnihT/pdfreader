import { useCallback, useEffect, useRef, useState } from "react";
import { buildDownloadUrl, buildExportUrl } from "../utils/drive";
import { chapterDisplayName, chapterSlugFromName } from "../utils/title";

export const DOCUMENT_MIME = {
  pdf: "application/pdf",
  txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  googleDoc: "application/vnd.google-apps.document",
};

const SUPPORTED_QUERY = [
  `mimeType='${DOCUMENT_MIME.pdf}'`,
  `mimeType='${DOCUMENT_MIME.txt}'`,
  `mimeType='${DOCUMENT_MIME.docx}'`,
  `mimeType='${DOCUMENT_MIME.googleDoc}'`,
].join(" or ");

function getDocumentType(file) {
  if (file.mimeType === DOCUMENT_MIME.pdf) return "pdf";
  if (file.mimeType === DOCUMENT_MIME.txt) return "txt";
  if (file.mimeType === DOCUMENT_MIME.docx) return "docx";
  if (file.mimeType === DOCUMENT_MIME.googleDoc) return "gdoc";

  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".docx")) return "docx";
  return "unknown";
}

export default function useDriveChapters(folderId) {
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prefetching, setPrefetching] = useState(false);

  const apiKey = useRef(import.meta.env.VITE_GOOGLE_API_KEY);

  const mapFiles = useCallback((files = []) => {
    return files.map((file) => {
      const displayName = chapterDisplayName(file.name);
      const slug = chapterSlugFromName(file.name);
      const type = getDocumentType(file);
      return {
        id: file.id,
        name: file.name,
        displayName,
        slug,
        type,
        mimeType: file.mimeType,
        url:
          type === "gdoc"
            ? buildExportUrl(file.id, "text/plain")
            : buildDownloadUrl(file.id),
        size: file.size ? Number(file.size) : undefined,
        modifiedTime: file.modifiedTime,
      };
    });
  }, []);

  const mergeSort = useCallback((prev, incoming) => {
    const map = new Map(prev.map((chapter) => [chapter.id, chapter]));
    for (const chapter of incoming) map.set(chapter.id, chapter);
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" })
    );
  }, []);

  const fetchPage = useCallback(
    async (token = null) => {
      if (!folderId) return { files: [], nextPageToken: null };
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and (${SUPPORTED_QUERY}) and trashed=false`,
        fields: "files(id,name,mimeType,modifiedTime,size),nextPageToken",
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
      console.error("prefetchAllMeta error:", e);
      return [];
    } finally {
      setPrefetching(false);
    }
  }, [folderId, fetchPage, mapFiles, mergeSort]);

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
