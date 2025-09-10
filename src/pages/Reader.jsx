import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDriveChapters from "../hooks/useDriveChapters";
import PdfScrollViewer from "../components/PdfScrollViewer";
import { rememberPage } from "../utils/storage";
import { buildDownloadUrl } from "../utils/drive";

export default function Reader() {
  const navigate = useNavigate();
  const { storyId, chapterId } = useParams();
  const { items: chapters } = useDriveChapters(storyId);

  const [currentDocId, setCurrentDocId] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null); // { url: string }

  const currentIndex = useMemo(
    () => chapters.findIndex((c) => c.id === chapterId),
    [chapters, chapterId]
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const openById = useCallback((id) => {
    setCurrentDocId(id);
    setPdfSrc({ url: buildDownloadUrl(id) }); // giao cho pdf.js tự tải, tránh CORS khi tự fetch
  }, []);

  // Mỗi khi đổi chapterId => load chapter mới
  useEffect(() => {
    if (chapterId) openById(chapterId);
  }, [chapterId, openById]);

  // Điều hướng qua chapter trước / sau
  const goPrevChapter = useCallback(() => {
    if (prevChapter) navigate(`/reader/${storyId}/${prevChapter.id}`);
  }, [navigate, storyId, prevChapter]);

  const goNextChapter = useCallback(() => {
    if (nextChapter) navigate(`/reader/${storyId}/${nextChapter.id}`);
  }, [navigate, storyId, nextChapter]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f1115", position: "relative" }}>
      {/* Viewer: render toàn bộ trang theo chiều dọc */}
      <PdfScrollViewer
        docSrc={pdfSrc}
        docId={currentDocId}
        onPageRemember={(docId, page) => rememberPage(docId, page)}
      />

      {/* 3 nút: Chapter trước | Mục lục | Chapter sau */}
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
          to={`/story/${storyId}`}
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
