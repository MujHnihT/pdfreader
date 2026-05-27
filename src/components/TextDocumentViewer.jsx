import React, { useEffect, useState } from "react";

export default function TextDocumentViewer({ chapter }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapter?.url) {
      setContent("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setContent("");

    (async () => {
      try {
        const response = await fetch(chapter.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        if (chapter.type === "docx") {
          const arrayBuffer = await response.arrayBuffer();
          const mammoth = await import("mammoth/mammoth.browser");
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (!cancelled) setContent(result.value || "");
          return;
        }

        const text = await response.text();
        if (!cancelled) setContent(text);
      } catch (e) {
        if (!cancelled) setError(`Không tải được nội dung: ${String(e)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chapter?.id, chapter?.type, chapter?.url]);

  if (loading) return <div className="viewer-state">Đang tải nội dung...</div>;
  if (error) return <div className="viewer-state error-text">{error}</div>;
  if (!content) return <div className="viewer-state">Không có nội dung để hiển thị.</div>;

  return (
    <div className="text-document-viewer">
      {content.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
