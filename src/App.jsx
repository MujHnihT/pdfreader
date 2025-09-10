import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import Home from "./pages/Home";
import Chapters from "./pages/Chapters";
import Reader from "./pages/Reader";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

function Shell() {
  const location = useLocation();
  const isReader = location.pathname.startsWith("/reader/");
  return (
    <>
      {!isReader && (
        <header
          style={{
            padding: ".5rem .75rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <strong>Truyện PDF</strong>
          </Link>
          <nav style={{ display: "flex", gap: 10 }}>
            <Link to="/" style={{ textDecoration: "none" }}>Trang chủ</Link>
          </nav>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/story/:slug" element={<Chapters />} />
        {/* chapterSlug thay cho chapterId */}
        <Route path="/reader/:slug/:chapterSlug" element={<Reader />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
