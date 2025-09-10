import { useCallback, useEffect, useRef, useState } from "react";
import { API_KEY, ROOT_FOLDER_ID, dedupeMergeSort, driveList } from "../utils/drive";

export default function useDriveStories(rootFolderId = ROOT_FOLDER_ID) {
  const bootRef = useRef(false);
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (token = null) => {
      setLoading(true);
      try {
        const data = await driveList({
          q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: "files(id,name,modifiedTime)",
          pageToken: token,
        });
        setItems((prev) => dedupeMergeSort(prev, data.files));
        setNextToken(data.nextPageToken || null);
        setError(null);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [rootFolderId]
  );

  useEffect(() => {
    if (!API_KEY || !rootFolderId) {
      setError("Thiếu API key hoặc Folder ID (.env: VITE_GOOGLE_API_KEY, VITE_DRIVE_FOLDER_ID)");
      return;
    }
    if (bootRef.current) return;
    bootRef.current = true;
    setItems([]);
    setNextToken(null);
    setError(null);
    void fetchPage(null);
  }, [rootFolderId, fetchPage]);

  return {
    items,
    nextToken,
    error,
    loading,
    fetchNext: () => fetchPage(nextToken),
  };
}
