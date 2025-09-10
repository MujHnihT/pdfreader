import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import { toSlug } from "../utils/slug";
import { saveSessionIndex } from "../utils/chapterIndex";

export default function Chapters() {
  const { slug } = useParams();
  const { items: stories } = useDriveStories();

  // tìm đúng truyện
  const story = useMemo(() => stories.find((s) => toSlug(s.name) === slug), [stories, slug]);
  const folderId = story?.id;

  const {
    items: chapters,
    nextToken,
    error,
    loading,
    prefetching,
    fetchFirstPage,
    fetchNext,
    prefetchAllMeta,
  } = useDriveChapters(folderId);

  // 1) UI: chỉ tải trang đầu
  useEffect(() => {
    if (!folderId) return;
    fetchFirstPage();
  }, [folderId, fetchFirstPage]);

  // 2) NGẦM: tải toàn bộ danh sách & lưu vào sessionStorage
  useEffect(() => {
    if (!folderId || !story?.name) return;
    let cancelled = false;
    (async () => {
      const all = await prefetchAllMeta();
      if (!cancelled && all.length) {
        saveSessionIndex(toSlug(story.name), all);
      }
    })();
    return () => { cancelled = true; };
  }, [folderId, story?.name, prefetchAllMeta]);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{story ? story.name : "Đang tải…"}</h2>
        <Link to="/" style={{ fontSize: 14 }}>← Trang chủ</Link>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          {prefetching ? "Đang tải toàn bộ chương (ngầm)…" : ""}
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

      <section style={{ marginTop: 16 }}>
        <h3 style={{ margin: "8px 0" }}>Danh sách chương</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                to={`/reader/${slug}/${c.slug}`}
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
                title={c.displayName}
              >
                <div
                  style={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.displayName}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {c.size ? `${(c.size / 1048576).toFixed(2)} MB` : "—"} ·{" "}
                  {new Date(c.modifiedTime).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 12 }}>
          <button onClick={fetchNext} disabled={!nextToken || loading}>
            {nextToken ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
          </button>
        </div>
      </section>
    </main>
  );
}
