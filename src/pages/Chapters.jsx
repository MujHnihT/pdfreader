import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import { toSlug } from "../utils/slug";
import { saveSessionIndex } from "../utils/chapterIndex";

export default function Chapters() {
  const { slug } = useParams();
  const { items: stories } = useDriveStories();
  const story = useMemo(() => stories.find((item) => toSlug(item.name) === slug), [stories, slug]);
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

  useEffect(() => {
    if (folderId) fetchFirstPage();
  }, [folderId, fetchFirstPage]);

  useEffect(() => {
    if (!folderId || !story?.name) return;
    let cancelled = false;
    (async () => {
      const all = await prefetchAllMeta();
      if (!cancelled && all.length) saveSessionIndex(toSlug(story.name), all);
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId, story?.name, prefetchAllMeta]);

  return (
    <main className="reader-shell">
      <aside className="chapter-sidebar">
        <div className="sidebar-title">
          <span>☷</span>
          <strong>Danh sách chương</strong>
        </div>
        {error && <div className="error-text">{error}</div>}
        <ul className="chapter-list">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link to={`/reader/${slug}/${chapter.slug}`} className="chapter-item" title={chapter.displayName}>
                <span className="dot" />
                <span>{chapter.displayName}</span>
                <small>{chapter.type?.toUpperCase()}</small>
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button className="secondary-btn full" onClick={fetchNext} disabled={!nextToken || loading}>
            {nextToken ? (loading ? "Đang tải..." : "Tải thêm chương") : "Hết danh sách"}
          </button>
        </div>
      </aside>

      <section className="content-column">
        <div className="story-hero">
          <div className="cover-art hero-cover" />
          <div className="hero-main">
            <h1>{story ? story.name : "Đang tải..."}</h1>
            <p>Tác giả: <span>An Nhiên</span></p>
            <div className="tag-row">
              <span>Ngôn tình</span>
              <span>Hiện đại</span>
              <span>Chữa lành</span>
            </div>
            <div className="rating-line">★ <strong>4.7</strong> <span>(2.1K đánh giá)</span></div>
            <p className="story-desc">
              Truyện được tải trực tiếp từ Google Drive. Hỗ trợ chương PDF, TXT và DOCX.
            </p>
          </div>
          <div className="stats-card">
            <div><span>Lượt xem</span><strong>125.6K</strong></div>
            <div><span>Lượt theo dõi</span><strong>12.8K</strong></div>
            <div><span>Số chương</span><strong>{chapters.length}</strong></div>
            <div><span>Cập nhật</span><strong>{story?.modifiedTime ? new Date(story.modifiedTime).toLocaleDateString() : "..."}</strong></div>
          </div>
        </div>

        <div className="reader-card empty-reader-card">
          <Link className="primary-btn inline-link" to={chapters[0] ? `/reader/${slug}/${chapters[0].slug}` : "#"}>
            Đọc chương đầu
          </Link>
          {prefetching && <span className="muted">Đang tải toàn bộ chương...</span>}
        </div>
      </section>
    </main>
  );
}
