import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import { toSlug } from "../utils/slug";

export default function Chapters() {
  const { slug } = useParams();

  const { items: stories, error: storiesError, loading: storiesLoading } = useDriveStories();

  const story = useMemo(() => stories.find((s) => toSlug(s.name) === slug), [stories, slug]);
  const folderId = story?.id;

  const {
    items: chapters,
    nextToken,
    error: chaptersError,
    loading: chaptersLoading,
    fetchNext,
  } = useDriveChapters(folderId);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ margin: 0 }}>{story ? story.name : "Đang tải…"}</h2>
        <Link to="/" style={{ fontSize: 14 }}>← Trang chủ</Link>
      </div>

      {(storiesError || chaptersError) && (
        <div style={{ color: "crimson", marginTop: 8 }}>
          {storiesError || chaptersError}
        </div>
      )}

      {!folderId && (storiesLoading || !stories.length) && (
        <div style={{ marginTop: 12 }}>Đang tải danh sách truyện…</div>
      )}

      {folderId && chapters.length === 0 && !chaptersLoading && !chaptersError && (
        <div style={{ marginTop: 12 }}>Truyện này chưa có chương PDF.</div>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
        {chapters.map((c) => {
          const chapterSlug = toSlug(c.name);
          return (
            <li key={c.id}>
              <Link
                to={`/reader/${slug}/${chapterSlug}`}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  marginBottom: 8,
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                }}
                title={c.name}
              >
                <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {c.size ? `${(c.size / 1048576).toFixed(2)} MB` : "—"} ·{" "}
                  {new Date(c.modifiedTime).toLocaleString()}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {folderId && (
        <div style={{ marginTop: 12 }}>
          <button onClick={fetchNext} disabled={!nextToken || chaptersLoading}>
            {nextToken ? (chaptersLoading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
          </button>
        </div>
      )}
    </main>
  );
}
