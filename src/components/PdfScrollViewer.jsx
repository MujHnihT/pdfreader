import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { STORAGE_KEY } from "../utils/storage";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

/**
 * Hiển thị toàn bộ trang PDF theo chiều dọc (cuộn).
 * - Nhận docSrc = { url: string } để pdf.js tự tải (tránh CORS khi tự fetch).
 * - Tự fit theo bề ngang container.
 * - Ghi nhớ trang đang xem (IntersectionObserver).
 */
export default function PdfScrollViewer({ docSrc, docId, onPageRemember }) {
  const [numPages, setNumPages] = useState(null);
  const containerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(900); // mặc định, sẽ đo lại
  const [visiblePage, setVisiblePage] = useState(1);

  const file = useMemo(() => (docSrc ? docSrc : null), [docSrc]); // { url }

  // Đo bề ngang container để fit chiều ngang
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const padding = 32; // padding container
      setPageWidth(Math.max(300, el.clientWidth - padding));
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }) => setNumPages(numPages), []);

  // Ghi nhớ "trang đang xem": dùng IntersectionObserver theo tỷ lệ hiển thị
  useEffect(() => {
    if (!docId || !numPages) return;
    const pageEls = containerRef.current?.querySelectorAll("[data-pdf-page]");
    if (!pageEls || pageEls.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // chọn entry có tỷ lệ hiển thị lớn nhất
        let best = { page: visiblePage, ratio: 0 };
        for (const e of entries) {
          const ratio = e.intersectionRatio;
          const p = Number(e.target.getAttribute("data-pdf-page"));
          if (ratio > best.ratio) best = { page: p, ratio };
        }
        if (best.page && best.page !== visiblePage) {
          setVisiblePage(best.page);
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    pageEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, numPages]);

  // Lưu trang đang xem
  useEffect(() => {
    if (!docId || !visiblePage) return;
    onPageRemember?.(docId, visiblePage);
  }, [docId, visiblePage, onPageRemember]);

  // Khôi phục vị trí (scroll tới trang đã lưu) sau khi numPages sẵn sàng
  useEffect(() => {
    if (!docId || !numPages) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const last = Number(map?.[docId] || 1);
      const target = containerRef.current?.querySelector(`[data-pdf-page="${last}"]`);
      if (target) target.scrollIntoView({ block: "start" });
    } catch {}
  }, [docId, numPages]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        background: "#0f1115",
        height: "100vh",
        width: "100vw",
        overflow: "auto",
        padding: 16,
      }}
    >
      {file ? (
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          loading={<div style={{ color: "#cbd5e1" }}>Loading…</div>}
          onLoadError={(e) => {
            console.error(e);
            alert("Can't load.");
          }}
        >
          {/* Render toàn bộ các trang theo chiều dọc */}
          {numPages &&
            Array.from({ length: numPages }, (_, idx) => {
              const pageNumber = idx + 1;
              return (
                <div
                  key={pageNumber}
                  data-pdf-page={pageNumber}
                  style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer
                    renderAnnotationLayer
                    loading={<div style={{ color: "#94a3b8" }}>Đang tải trang {pageNumber}…</div>}
                  />
                </div>
              );
            })}
        </Document>
      ) : (
        <div style={{ color: "#94a3b8" }}>Đang mở chương…</div>
      )}
    </div>
  );
}
