import React, { useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import Home from "./pages/Home";
import Chapters from "./pages/Chapters";
import Reader from "./pages/Reader";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const AUTH_KEY = "pdf-reader:auth";

function Login({ onLogin }) {
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (username === "admin" && password === "admin") {
      localStorage.setItem(AUTH_KEY, "1");
      onLogin();
      return;
    }
    setError("Sai tài khoản hoặc mật khẩu.");
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand brand-large">
          <span className="brand-icon">▯</span>
          <span>ReadStory</span>
        </div>
        <h1>Đăng nhập</h1>
        <p>Đăng nhập bằng admin/admin để đọc truyện PDF được tải từ Google Drive.</p>
        <label>
          Tài khoản
          <input
            name="username"
            type="text"
            autoComplete="username"
            placeholder="admin"
            autoFocus
          />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="admin"
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-btn" type="submit">Đăng nhập</button>
      </form>
    </main>
  );
}

function Shell({ onLogout }) {
  const location = useLocation();
  const isReader = location.pathname.startsWith("/reader/");

  return (
    <>
      {!isReader && (
        <header className="topbar">
          <Link to="/" className="brand">
            <span className="brand-icon">▯</span>
            <span>ReadStory</span>
          </Link>
          <nav className="nav-links">
            <Link className="active" to="/">Trang chủ</Link>
            <span>Thể loại</span>
            <span>Thư viện</span>
            <span>Xếp hạng</span>
            <span>Cộng đồng</span>
          </nav>
          <div className="search-box">Tìm truyện, tác giả...</div>
          <button className="ghost-btn" onClick={onLogout}>Đăng xuất</button>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/story/:slug" element={<Chapters />} />
        <Route path="/reader/:slug/:chapterSlug" element={<Reader onLogout={onLogout} />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return (
    <BrowserRouter>
      {authed ? <Shell onLogout={logout} /> : <Login onLogin={() => setAuthed(true)} />}
    </BrowserRouter>
  );
}
