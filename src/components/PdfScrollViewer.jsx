import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { STORAGE_KEY } from "../utils/storage";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export default function PdfScrollViewer({ docSrc, docId, onPageRemember }) {
  const [numPages, setNumPages] = useState(null);
  const containerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(820);
  const [visiblePage, setVisiblePage] = useState(1);
  const file = useMemo(() => (docSrc ? docSrc : null), [docSrc]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => setPageWidth(Math.max(300, Math.min(900, el.clientWidth - 32)));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }) => setNumPages(numPages), []);

  useEffect(() => {
    if (!docId || !numPages) return;
    const pageEls = containerRef.current?.querySelectorAll("[data-pdf-page]");
    if (!pageEls?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best = { page: visiblePage, ratio: 0 };
        for (const entry of entries) {
          const page = Number(entry.target.getAttribute("data-pdf-page"));
          if (entry.intersectionRatio > best.ratio) best = { page, ratio: entry.intersectionRatio };
        }
        if (best.page && best.page !== visiblePage) setVisiblePage(best.page);
      },
      { root: containerRef.current, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    pageEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [docId, numPages, visiblePage]);

  useEffect(() => {
    if (docId && visiblePage) onPageRemember?.(docId, visiblePage);
  }, [docId, visiblePage, onPageRemember]);

  useEffect(() => {
    if (!docId || !numPages) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const last = Number(map?.[docId] || 1);
      containerRef.current?.querySelector(`[data-pdf-page="${last}"]`)?.scrollIntoView({ block: "start" });
    } catch {}
  }, [docId, numPages]);

  return (
    <div ref={containerRef} className="pdf-scroll-viewer">
      {file ? (
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="viewer-state">Đang tải PDF...</div>}
          onLoadError={(error) => {
            console.error(error);
            alert("Không tải được PDF.");
          }}
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <div key={pageNumber} data-pdf-page={pageNumber} className="pdf-page-wrap">
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer
                    renderAnnotationLayer
                    loading={<div className="viewer-state">Đang tải trang {pageNumber}...</div>}
                  />
                </div>
              );
            })}
        </Document>
      ) : (
        <div className="viewer-state">Đang mở chương...</div>
      )}
    </div>
  );
}
