import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import PdfScrollViewer from "../components/PdfScrollViewer";
import { rememberPage } from "../utils/storage";
import { buildDownloadUrl } from "../utils/drive";
import { toSlug } from "../utils/slug";
import { getSessionIndex } from "../utils/chapterIndex";

export default function Reader() {
  const navigate = useNavigate();
  const { slug, chapterSlug } = useParams();

  // map slug -> folderId (để fallback fetch nếu chưa có session index)
  const { items: stories } = useDriveStories();
  const story = useMemo(() => stories.find((s) => toSlug(s.name) === slug), [stories, slug]);
  const folderId = story?.id;

  // 1) Ưu tiên chapters từ session (đã prefetch ngầm ở trang Chapters)
  const sess = getSessionIndex(slug);
  const sessionChapters = sess?.chapters || [];

  // 2) Fallback: nếu chưa có session, fetch từ Drive
  const { items: fetchedChapters } = useDriveChapters(folderId);

  // 3) Nguồn chính để điều hướng
  const chapters = sessionChapters.length ? sessionChapters : fetchedChapters;

  // xác định current, prev, next theo slug
  const currentIndex = useMemo(
    () => chapters.findIndex((c) => c.slug === chapterSlug),
    [chapters, chapterSlug]
  );
  const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : null;
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const [currentDocId, setCurrentDocId] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);

  const openById = useCallback((id) => {
    setCurrentDocId(id);
    setPdfSrc({ url: buildDownloadUrl(id) });
  }, []);

  useEffect(() => {
    if (currentChapter?.id) openById(currentChapter.id);
  }, [currentChapter?.id, openById]);

  const goPrevChapter = useCallback(() => {
    if (prevChapter) navigate(`/reader/${slug}/${prevChapter.slug}`);
  }, [navigate, slug, prevChapter]);

  const goNextChapter = useCallback(() => {
    if (nextChapter) navigate(`/reader/${slug}/${nextChapter.slug}`);
  }, [navigate, slug, nextChapter]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f1115", position: "relative" }}>
      <PdfScrollViewer
        docSrc={pdfSrc}
        docId={currentDocId}
        onPageRemember={(docId, page) => rememberPage(docId, page)}
      />

      <div style={toolbarWrap}>
        <button
          onClick={goPrevChapter}
          disabled={!prevChapter}
          style={{ ...pillBtn, opacity: prevChapter ? 1 : 0.5 }}
        >
          ← Chương trước
        </button>

        <Link
          to={`/story/${slug}`}
          style={{
            ...pillBtn,
            minWidth: 120,
            textDecoration: "none",
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ☰ {story?.name || "Mục lục"}
        </Link>

        <button
          onClick={goNextChapter}
          disabled={!nextChapter}
          style={{ ...pillBtn, opacity: nextChapter ? 1 : 0.5 }}
        >
          Chương sau →
        </button>
      </div>

      <div style={titleBadge}>
        {currentChapter?.displayName || "Đang mở chương…"}
      </div>
    </div>
  );
}

const toolbarWrap = {
  position: "fixed",
  left: "50%",
  bottom: 16,
  transform: "translateX(-50%)",
  display: "flex",
  gap: 10,
  zIndex: 50,
};
const pillBtn = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
};
const titleBadge = {
  position: "fixed",
  left: 16,
  top: 12,
  padding: "6px 10px",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 8,
  fontSize: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  zIndex: 50,
};
