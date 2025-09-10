import { useCallback, useEffect, useState } from "react";
import { buildDownloadUrl, dedupeMergeSort, driveList } from "../utils/drive";

export default function useDriveChapters(folderId) {
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setItems([]);
    setNextToken(null);
    setError(null);
  }, []);

  const fetchPage = useCallback(
    async (token = null) => {
      if (!folderId) return;
      setLoading(true);
      try {
        const data = await driveList({
          q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
          fields: "files(id,name,modifiedTime,size)",
          pageToken: token,
        });
        const mapped = (data.files || []).map((f) => ({
          id: f.id,
          name: f.name,
          url: buildDownloadUrl(f.id),
          size: f.size ? Number(f.size) : undefined,
          modifiedTime: f.modifiedTime,
        }));
        setItems((prev) => dedupeMergeSort(prev, mapped));
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
    reset();
    if (folderId) void fetchPage(null);
  }, [folderId, fetchPage, reset]);

  return {
    items,
    nextToken,
    error,
    loading,
    fetchNext: () => fetchPage(nextToken),
    reset,
  };
}
