import React from "react";
import { useNavigate } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import { toSlug } from "../utils/slug";

export default function Home() {
  const navigate = useNavigate();
  const { items: stories, nextToken, error, loading, fetchNext } = useDriveStories();

  return (
    <main style={{ padding: "16px" }}>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Danh sách truyện</h2>
        {error && <span style={{ color: "crimson" }}> · {error}</span>}
      </div>

      {stories.length === 0 && !loading && !error && (
        <div>Không có truyện nào trong thư mục gốc.</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {stories.map((s) => {
          const slug = toSlug(s.name);
          return (
            <button
              key={s.id}
              onClick={() => navigate(`/story/${slug}`)}
              style={{
                textAlign: "left",
                padding: 12,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
              title={s.name}
            >
              <div
                style={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 6,
                }}
              >
                {s.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Cập nhật: {new Date(s.modifiedTime).toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={fetchNext} disabled={!nextToken || loading}>
          {nextToken ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
        </button>
      </div>
    </main>
  );
}
