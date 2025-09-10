import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import useDriveChapters from "../hooks/useDriveChapters";
import PdfScrollViewer from "../components/PdfScrollViewer";
import { rememberPage } from "../utils/storage";
import { buildDownloadUrl } from "../utils/drive";
import { toSlug } from "../utils/slug";

export default function Reader() {
  const navigate = useNavigate();
  const { slug, chapterSlug } = useParams();

  // map slug -> folderId
  const { items: stories } = useDriveStories();
  const story = useMemo(() => stories.find((s) => toSlug(s.name) === slug), [stories, slug]);
  const folderId = story?.id;

  // lấy list chapters theo folderId (để tìm chapterId, prev/next)
  const { items: chapters } = useDriveChapters(folderId);

  // xác định chương hiện tại theo chapterSlug
  const currentIndex = useMemo(() => {
    if (!chapters.length) return -1;
    return chapters.findIndex((c) => toSlug(c.name) === chapterSlug);
  }, [chapters, chapterSlug]);

  const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : null;
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const [currentDocId, setCurrentDocId] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null); // { url: string }

  const openById = useCallback((id) => {
    setCurrentDocId(id);
    setPdfSrc({ url: buildDownloadUrl(id) }); // để pdf.js tự tải, tránh CORS khi tự fetch
  }, []);

  // Khi xác định được currentChapter -> mở PDF
  useEffect(() => {
    if (currentChapter?.id) openById(currentChapter.id);
  }, [currentChapter?.id, openById]);

  const goPrevChapter = useCallback(() => {
    if (!prevChapter) return;
    navigate(`/reader/${slug}/${toSlug(prevChapter.name)}`);
  }, [navigate, slug, prevChapter]);

  const goNextChapter = useCallback(() => {
    if (!nextChapter) return;
    navigate(`/reader/${slug}/${toSlug(nextChapter.name)}`);
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
          aria-label="Chương trước"
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
          aria-label="Mục lục"
        >
          ☰ Mục lục
        </Link>

        <button
          onClick={goNextChapter}
          disabled={!nextChapter}
          style={{ ...pillBtn, opacity: nextChapter ? 1 : 0.5 }}
          aria-label="Chương sau"
        >
          Chương sau →
        </button>
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
