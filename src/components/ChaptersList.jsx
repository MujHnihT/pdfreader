import React from "react";

export default function ChaptersList({ chapters, onOpen, onLoadMore, hasMore, error, loading }) {
  return (
    <aside style={{ borderRight: "1px solid #e5e7eb", overflow: "auto" }}>
      <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <strong>Chương (PDF)</strong>
        {error && <span style={{ color: "crimson" }}> · Lỗi: {error}</span>}
      </div>

      {chapters.map((c) => (
        <div
          key={c.id}
          onClick={() => onOpen(c)}
          style={{ padding: "8px 10px", cursor: "pointer" }}
          title={c.name}
        >
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.name}
          </div>
          <small style={{ opacity: 0.7 }}>
            {c.size ? `${(c.size / 1048576).toFixed(2)} MB` : "—"} ·{" "}
            {new Date(c.modifiedTime).toLocaleString()}
          </small>
        </div>
      ))}

      <div style={{ padding: "8px 10px", display: "flex", gap: 8 }}>
        <button onClick={onLoadMore} disabled={!hasMore || loading}>
          {hasMore ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
        </button>
      </div>
    </aside>
  );
}
