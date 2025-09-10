import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

// ========== CONFIG ==========
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const ROOT_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID
// ============================

const STORAGE_KEY = 'pdf-reader:lastPages'

function useLastPages() {
  const [map, setMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  })
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) }, [map])
  return [map, setMap]
}

function buildDownloadUrl(fileId) {
  // Tải bằng Drive v3 alt=media (public file)
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`
}

export default function App() {
  // Truyện (subfolders)
  const [stories, setStories] = useState([])
  const [storiesNextToken, setStoriesNextToken] = useState(null)
  const [storiesError, setStoriesError] = useState(null)
  const [selectedStoryId, setSelectedStoryId] = useState(null)

  // Chương (PDFs)
  const [chapters, setChapters] = useState([])
  const [chaptersNextToken, setChaptersNextToken] = useState(null)
  const [chaptersError, setChaptersError] = useState(null)

  // Viewer
  const [pdfData, setPdfData] = useState(null)   // ArrayBuffer đã tải FULL
  const [numPages, setNumPages] = useState(null)
  const [page, setPage] = useState(1)
  const [lastPages, setLastPages] = useLastPages()

  // === Fix: memo hóa file prop để tránh warning reload không cần thiết ===
  const pdfFile = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData])

  // Tạo 1 id ổn định từ pdfData để nhớ trang
  const id = useMemo(() => (pdfData ? String(pdfData.byteLength) : ''), [pdfData])

  useEffect(() => {
    if (!id) return
    const last = lastPages[id]
    if (last) setPage(last)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => { if (id) setLastPages(prev => ({ ...prev, [id]: page })) }, [id, page, setLastPages])

  // ===== Stories (subfolders) =====

  // Fix StrictMode: ngăn boot effect chạy 2 lần ở dev
  const storiesBootFetched = useRef(false)

  // Merge có dedupe theo id
  function mergeStories(prev, incoming) {
    const map = new Map(prev.map(f => [f.id, f]))
    for (const f of incoming || []) map.set(f.id, f)
    // Giữ order name_natural (có thể đã có sẵn từ API, sort lại cho chắc)
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
    )
  }

  async function fetchStoriesPage(pageToken) {
    try {
      const params = new URLSearchParams({
        q: `'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,modifiedTime),nextPageToken',
        orderBy: 'name_natural',
        pageSize: '100',
        key: API_KEY
      })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStories(prev => mergeStories(prev, data.files))
      setStoriesNextToken(data.nextPageToken || null)
    } catch (e) {
      setStoriesError(String(e))
    }
  }

  useEffect(() => {
    if (!API_KEY || !ROOT_FOLDER_ID) {
      setStoriesError('Thiếu API key hoặc Folder ID (.env: VITE_GOOGLE_API_KEY, VITE_DRIVE_FOLDER_ID)')
      return
    }
    if (storiesBootFetched.current) return // chặn lần 2 (StrictMode dev)
    storiesBootFetched.current = true

    setStories([]); setStoriesNextToken(null); setStoriesError(null)
    fetchStoriesPage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Chapters (PDFs in a story) =====
  async function fetchChaptersPage(folderId, pageToken) {
    if (!folderId) return
    try {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
        fields: 'files(id,name,modifiedTime,size),nextPageToken',
        orderBy: 'name_natural',
        pageSize: '100',
        key: API_KEY
      })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const mapped = (data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        url: buildDownloadUrl(f.id),
        size: f.size ? Number(f.size) : undefined,
        modifiedTime: f.modifiedTime
      }))
      // Dedupe chương luôn đề phòng API lặp trang
      setChapters(prev => {
        const map = new Map(prev.map(c => [c.id, c]))
        for (const c of mapped) map.set(c.id, c)
        return Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
        )
      })
      setChaptersNextToken(data.nextPageToken || null)
    } catch (e) {
      setChaptersError(String(e))
    }
  }

  function selectStory(folderId) {
    setSelectedStoryId(folderId)
    setChapters([]); setChaptersNextToken(null); setChaptersError(null)
    setPdfData(null); setNumPages(null); setPage(1)
    if (folderId) fetchChaptersPage(folderId, null)
  }

  // ===== Preload toàn bộ PDF (1 lần) rồi đọc =====
  async function openChapterAndPreload(url) {
    try {
      setPdfData(null); setNumPages(null); setPage(1)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Tải PDF thất bại: HTTP ${res.status}`)
      const buf = await res.arrayBuffer()     // <— tải FULL file vào bộ nhớ
      setPdfData(buf)
    } catch (e) {
      console.error(e)
      alert('Không mở được PDF. Kiểm tra quyền chia sẻ file/folder trên Drive.')
    }
  }

  function onDocumentLoadSuccess({ numPages }) { setNumPages(numPages) }
  function go(delta) {
    setPage(p => {
      const next = Math.min(Math.max(1, p + delta), numPages || 1)
      return next
    })
  }

  // Keyboard ← →
  useEffect(() => {
    function onKey(e) {
      if (!numPages) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [numPages])

  return (
    <div className="app" style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* Header tối giản */}
      <div style={{ padding: '.5rem .75rem', borderBottom:'1px solid #e5e7eb', display:'flex', gap:8, alignItems:'center' }}>
        <strong>Truyện (thư mục)</strong>
        {storiesError && <span style={{ color:'crimson' }}> · Lỗi: {storiesError}</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 300px 1fr', height:'calc(100vh - 56px)' }}>
        {/* Cột truyện */}
        <aside style={{ borderRight:'1px solid #e5e7eb', overflow:'auto' }}>
          {stories.map(s => (
            <div key={s.id}
                 onClick={() => selectStory(s.id)}
                 style={{ padding:'8px 10px', cursor:'pointer',
                          background: (selectedStoryId === s.id) ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
              <div title={s.name}>{s.name}</div>
              <small style={{ opacity:.7 }}>{new Date(s.modifiedTime).toLocaleString()}</small>
            </div>
          ))}
          <div style={{ padding:'8px 10px' }}>
            <button onClick={() => fetchStoriesPage(storiesNextToken)} disabled={!storiesNextToken}>
              {storiesNextToken ? 'Tải thêm' : 'Hết danh sách'}
            </button>
          </div>
        </aside>

        {/* Cột chương */}
        <aside style={{ borderRight:'1px solid #e5e7eb', overflow:'auto' }}>
          <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
            <strong>Chương (PDF)</strong>
            {chaptersError && <span style={{ color:'crimson' }}> · Lỗi: {chaptersError}</span>}
          </div>
          {chapters.map(c => (
            <div key={c.id}
                 onClick={() => openChapterAndPreload(c.url)}
                 style={{ padding:'8px 10px', cursor:'pointer' }}>
              <div title={c.name}>{c.name}</div>
              <small style={{ opacity:.7 }}>
                {c.size ? `${(c.size/1048576).toFixed(2)} MB` : '—'} · {new Date(c.modifiedTime).toLocaleString()}
              </small>
            </div>
          ))}
          <div style={{ padding:'8px 10px' }}>
            <button onClick={() => fetchChaptersPage(selectedStoryId, chaptersNextToken)} disabled={!chaptersNextToken || !selectedStoryId}>
              {chaptersNextToken ? 'Tải thêm' : 'Hết danh sách'}
            </button>
          </div>
        </aside>

        {/* Viewer + chỉ 2 nút ← → */}
        <div style={{ position:'relative', background:'#f7f7f7', overflow:'auto' }}>
          <div style={{ padding:'1rem', display:'flex', justifyContent:'center' }}>
            {pdfFile ? (
              <Document
                file={pdfFile}            // <— memoized, tránh warning duplicate load
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div>Đang tải...</div>}
                onLoadError={(e) => { console.error(e); alert('Không mở được PDF.') }}
              >
                <Page pageNumber={page} scale={1.1} renderTextLayer renderAnnotationLayer />
              </Document>
            ) : (
              <div style={{ color:'#64748b' }}>Chọn chương để đọc. PDF sẽ tải trọn file một lần.</div>
            )}
          </div>

          {/* Nút điều hướng trái/phải, cố định hai bên */}
          {numPages && (
            <>
              <button
                onClick={() => go(-1)}
                disabled={page <= 1}
                style={{
                  position:'absolute', left:8, top:'50%', transform:'translateY(-50%)',
                  padding:'10px 14px', borderRadius:999, border:'1px solid #e5e7eb', background:'#fff'
                }}
                aria-label="Trang trước"
              >
                ←
              </button>
              <button
                onClick={() => go(1)}
                disabled={page >= numPages}
                style={{
                  position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                  padding:'10px 14px', borderRadius:999, border:'1px solid #e5e7eb', background:'#fff'
                }}
                aria-label="Trang sau"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
