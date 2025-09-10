// ENV (Vite)
export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
export const ROOT_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID;

export const sortByName = (a, b) =>
  a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" });

export const dedupeMergeSort = (prev, incoming) => {
  const map = new Map(prev.map((x) => [x.id, x]));
  for (const x of incoming || []) map.set(x.id, x);
  return Array.from(map.values()).sort(sortByName);
};

export const buildDownloadUrl = (fileId) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;

export async function driveList({
  q,
  fields,
  orderBy = "name_natural",
  pageSize = 100,
  pageToken,
}) {
  const params = new URLSearchParams({
    q,
    fields: `${fields},nextPageToken`,
    orderBy,
    pageSize: String(pageSize),
    key: API_KEY,
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
