import React from "react";

export default function StoriesList({
  stories,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore,
  error,
  loading,
}) {
  return (
    <aside style={{ borderRight: "1px solid #e5e7eb", overflow: "auto" }}>
      {stories.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            padding: "8px 10px",
            cursor: "pointer",
            background: selectedId === s.id ? "rgba(59,130,246,0.12)" : "transparent",
          }}
          title={s.name}
        >
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.name}
          </div>
          <small style={{ opacity: 0.7 }}>{new Date(s.modifiedTime).toLocaleString()}</small>
        </div>
      ))}
      <div style={{ padding: "8px 10px", display: "flex", gap: 8 }}>
        <button onClick={onLoadMore} disabled={!hasMore || loading}>
          {hasMore ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
        </button>
        {error && <span style={{ color: "crimson" }}> · Lỗi: {error}</span>}
      </div>
    </aside>
  );
}
