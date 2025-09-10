// src/components/PdfViewer.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { STORAGE_KEY } from "../utils/storage";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export default function PdfViewer({ docBuffer, docId, onPageRemember, showArrows = true }) {
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(1);

  const pdfFile = useMemo(() => (docBuffer ? { data: docBuffer } : null), [docBuffer]);

  const onLoadSuccess = useCallback(({ numPages }) => setNumPages(numPages), []);

  const go = useCallback(
    (delta) =>
      setPage((p) => {
        const next = Math.min(Math.max(1, p + delta), numPages || 1);
        return next;
      }),
    [numPages]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (!numPages) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages, go]);

  useEffect(() => {
    if (!docId) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const map = JSON.parse(raw);
      const last = map?.[docId];
      if (last) setPage(Number(last) || 1);
    } catch {}
  }, [docId]);

  useEffect(() => {
    if (!docId) return;
    onPageRemember?.(docId, page);
  }, [docId, page, onPageRemember]);

  return (
    <div style={{ position: "relative", background: "#0f1115", height: "100vh", overflow: "auto" }}>
      <div style={{ padding: "1rem", display: "flex", justifyContent: "center" }}>
        {pdfFile ? (
          <Document
            file={pdfFile}
            onLoadSuccess={onLoadSuccess}
            loading={<div style={{ color: "#cbd5e1" }}>Đang tải...</div>}
            onLoadError={(e) => {
              console.error(e);
              alert("Không mở được PDF.");
            }}
          >
            <Page pageNumber={page} scale={1.12} renderTextLayer renderAnnotationLayer />
          </Document>
        ) : (
          <div style={{ color: "#94a3b8" }}>Đang mở chương…</div>
        )}
      </div>

      {/* Ẩn mũi tên mặc định nếu showArrows=false */}
      {showArrows && numPages && (
        <>
          <button
            onClick={() => go(-1)}
            disabled={page <= 1}
            style={btnSideStyle("left")}
            aria-label="Trang trước"
          >
            ←
          </button>
          <button
            onClick={() => go(1)}
            disabled={page >= numPages}
            style={btnSideStyle("right")}
            aria-label="Trang sau"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}

function btnSideStyle(side) {
  return {
    position: "fixed",
    [side]: 12,
    top: "50%",
    transform: "translateY(-50%)",
    padding: "12px 16px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
  };
}
