import React from "react";
import { useNavigate } from "react-router-dom";
import useDriveStories from "../hooks/useDriveStories";
import { toSlug } from "../utils/slug";

export default function Home() {
  const navigate = useNavigate();
  const { items: stories, nextToken, error, loading, fetchNext } = useDriveStories();

  return (
    <main className="app-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Google Drive Library</p>
          <h1>Danh sách truyện</h1>
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>

      {stories.length === 0 && !loading && !error && (
        <div className="empty-state">Không có truyện nào trong thư mục gốc.</div>
      )}

      <div className="story-grid">
        {stories.map((story) => {
          const slug = toSlug(story.name);
          return (
            <button
              key={story.id}
              onClick={() => navigate(`/story/${slug}`)}
              className="story-card"
              title={story.name}
            >
              <div className="cover-art" />
              <div className="story-card-title">{story.name}</div>
              <div className="muted">Cập nhật: {new Date(story.modifiedTime).toLocaleString()}</div>
            </button>
          );
        })}
      </div>

      <div className="load-more">
        <button className="secondary-btn" onClick={fetchNext} disabled={!nextToken || loading}>
          {nextToken ? (loading ? "Đang tải..." : "Tải thêm") : "Hết danh sách"}
        </button>
      </div>
    </main>
  );
}
