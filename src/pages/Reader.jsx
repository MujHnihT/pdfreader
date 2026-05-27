import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import PdfScrollViewer from "../components/PdfScrollViewer";
import TextDocumentViewer from "../components/TextDocumentViewer";
import { rememberPage } from "../utils/storage";
import { buildDownloadUrl } from "../utils/drive";
import { toSlug } from "../utils/slug";
import { getSessionIndex, saveSessionIndex } from "../utils/chapterIndex";

function inferType(chapter) {
  if (chapter?.type) return chapter.type;
  const name = String(chapter?.name || "").toLowerCase();
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".docx")) return "docx";
  return "pdf";
}

function normalizeChapter(chapter) {
  const type = inferType(chapter);
  return {
    ...chapter,
    type,
    url: chapter.url || buildDownloadUrl(chapter.id),
  };
}

export default function Reader({ onLogout }) {
  const navigate = useNavigate();
  const { slug, chapterSlug } = useParams();

  const { items: stories } = useDriveStories();
  const story = useMemo(() => stories.find((item) => toSlug(item.name) === slug), [stories, slug]);
  const folderId = story?.id;

  const [cachedChapters, setCachedChapters] = useState(() => getSessionIndex(slug)?.chapters || []);
  const {
    items: fetchedChapters,
    loading,
    fetchFirstPage,
    prefetchAllMeta,
  } = useDriveChapters(folderId);

  useEffect(() => {
    setCachedChapters(getSessionIndex(slug)?.chapters || []);
  }, [slug]);

  useEffect(() => {
    if (!folderId || cachedChapters.length) return;
    fetchFirstPage();
  }, [folderId, cachedChapters.length, fetchFirstPage]);

  useEffect(() => {
    if (!folderId || cachedChapters.length) return;
    let cancelled = false;
    (async () => {
      const all = await prefetchAllMeta();
      if (!cancelled && all.length) {
        saveSessionIndex(slug, all);
        setCachedChapters(all);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId, cachedChapters.length, slug, prefetchAllMeta]);

  const chapters = useMemo(
    () => (cachedChapters.length ? cachedChapters : fetchedChapters).map(normalizeChapter),
    [cachedChapters, fetchedChapters]
  );
  const currentIndex = useMemo(
    () => chapters.findIndex((chapter) => chapter.slug === chapterSlug),
    [chapters, chapterSlug]
  );
  const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : null;
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const [pdfSrc, setPdfSrc] = useState(null);

  const openChapter = useCallback((chapter) => {
    if (chapter?.type === "pdf") {
      setPdfSrc({ url: chapter.url || buildDownloadUrl(chapter.id) });
      return;
    }
    setPdfSrc(null);
  }, []);

  useEffect(() => {
    if (currentChapter?.id) openChapter(currentChapter);
  }, [currentChapter, openChapter]);

  const goPrevChapter = useCallback(() => {
    if (prevChapter) navigate(`/reader/${slug}/${prevChapter.slug}`);
  }, [navigate, slug, prevChapter]);

  const goNextChapter = useCallback(() => {
    if (nextChapter) navigate(`/reader/${slug}/${nextChapter.slug}`);
  }, [navigate, slug, nextChapter]);

  return (
    <main className="reader-shell with-topbar">
      <header className="topbar reader-topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">▯</span>
          <span>ReadStory</span>
        </Link>
        <nav className="nav-links">
          <Link className="active" to="/">Trang chủ</Link>
          <span>Thể loại</span>
          <span>Thư viện</span>
          <span>Xếp hạng</span>
          <span>Cộng đồng</span>
        </nav>
        <div className="search-box">Tìm truyện, tác giả...</div>
        <button className="ghost-btn" onClick={onLogout}>Đăng xuất</button>
      </header>

      <aside className="chapter-sidebar">
        <div className="sidebar-title">
          <span>☷</span>
          <strong>Danh sách chương</strong>
        </div>
        <ul className="chapter-list">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                to={`/reader/${slug}/${chapter.slug}`}
                className={`chapter-item ${chapter.slug === chapterSlug ? "active" : ""}`}
                title={chapter.displayName}
              >
                <span className="dot" />
                <span>{chapter.displayName}</span>
                <small>{chapter.type?.toUpperCase()}</small>
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <span className="muted">{loading ? "Đang tải chương..." : `${chapters.length} chương`}</span>
        </div>
      </aside>

      <section className="content-column">
        <div className="story-hero compact">
          <div className="cover-art hero-cover" />
          <div className="hero-main">
            <h1>{story?.name || "Đang tải truyện..."}</h1>
            <p>Tác giả: <span>An Nhiên</span></p>
            <div className="tag-row">
              <span>Ngôn tình</span>
              <span>Hiện đại</span>
              <span>Chữa lành</span>
            </div>
            <p className="story-desc">Đọc PDF, TXT và DOCX trực tiếp từ Google Drive.</p>
          </div>
          <div className="stats-card">
            <div><span>Lượt xem</span><strong>125.6K</strong></div>
            <div><span>Số chương</span><strong>{chapters.length}</strong></div>
            <div><span>Cập nhật</span><strong>Hôm nay</strong></div>
          </div>
        </div>

        <div className="reader-card">
          <div className="reader-toolbar">
            <button onClick={goPrevChapter} disabled={!prevChapter}>‹ Chương trước</button>
            <div className="tool-group">
              <button>A-</button>
              <button>A+</button>
              <button>☀</button>
              <button>☾</button>
              <button>♡</button>
              <button>⚙</button>
            </div>
            <button onClick={goNextChapter} disabled={!nextChapter}>Chương tiếp theo ›</button>
          </div>

          <div className="chapter-heading">
            <h2>{currentChapter?.displayName || "Đang mở chương..."}</h2>
            <div className="ornament">◇</div>
          </div>

          {currentChapter?.type === "pdf" ? (
            <PdfScrollViewer
              docSrc={pdfSrc}
              docId={currentChapter.id}
              onPageRemember={(docId, page) => rememberPage(docId, page)}
            />
          ) : (
            <TextDocumentViewer chapter={currentChapter} />
          )}

          <div className="reader-progress">
            <span>Đọc chương: {currentIndex >= 0 ? currentIndex + 1 : 0}/{chapters.length}</span>
            <span>2.3K lượt xem</span>
            <span>Đã lưu</span>
          </div>
        </div>
      </section>

      <aside className="floating-actions">
        <button>Mục lục</button>
        <button>Bình luận</button>
        <button>Theo dõi</button>
        <button>Chia sẻ</button>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Lên đầu</button>
      </aside>
    </main>
  );
}
