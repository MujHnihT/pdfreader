import React from "react";
import { Link, useParams } from "react-router-dom";
import useDriveChapters from "../hooks/useDriveChapters";

export default function Chapters() {
  const { storyId } = useParams();
  const { items: chapters, nextToken, error, loading, fetchNext } = useDriveChapters(storyId);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Danh sách chương</h2>
        <Link to="/" style={{ fontSize: 14 }}>← Trang chủ</Link>
      </div>
      {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

      {chapters.length === 0 && !loading && !error && (
        <div style={{ marginTop: 12 }}>Truyện này chưa có chương PDF.</div>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
        {chapters.map((c) => (
          <li key={c.id}>
            <Link
              to={`/reader/${storyId}/${c.id}`}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                marginBottom: 8,
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
              }}
              title={c.name}
            >
              <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {c.size ? `${(c.size / 1048576).toFixed(2)} MB` : "—"} ·{" "}
                {new Date(c.modifiedTime).toLocaleString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchNext} disabled={!nextToken || loading}>
          {nextToken ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
        </button>
      </div>
    </main>
  );
}
