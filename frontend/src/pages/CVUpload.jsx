import React, { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function CVUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.name.endsWith('.pdf') || f.name.endsWith('.docx')
    )
    if (valid.length !== newFiles.length) toast.error('بعض الملفات غير مدعومة (PDF و DOCX فقط)')
    setFiles(prev => [...prev, ...valid])
  }

  const handleUpload = async () => {
    if (!files.length) return toast.error('اختر ملفاً على الأقل')
    setUploading(true)
    setResults([])
    const fd = new FormData()
    files.forEach(f => fd.append('cvs', f))
    try {
      const { data } = await axios.post('/api/candidates/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(data.results)
      const success = data.results.filter(r => r.success).length
      toast.success(`تم معالجة ${success} سيرة ذاتية بنجاح`)
      setFiles([])
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ في الرفع')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">رفع السير الذاتية</h1>
        <p className="page-subtitle">الذكاء الاصطناعي سيستخرج البيانات تلقائياً</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        >
          <Upload />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>اسحب الملفات هنا أو اضغط للاختيار</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>PDF و Word (.docx) — حتى 20 ملف دفعة واحدة</p>
          <input ref={inputRef} type="file" multiple accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>الملفات المختارة ({files.length}):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', padding: '6px 12px', borderRadius: 20, fontSize: 13 }}>
                  <FileText size={14} color="#2563a8" />
                  <span>{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', marginRight: 2, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ minWidth: 160, justifyContent: 'center' }}>
              {uploading ? <><Loader size={16} className="spin" /> جارٍ المعالجة...</> : <><Upload size={16} /> رفع ومعالجة</>}
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 15, color: 'var(--text-muted)' }}>الذكاء الاصطناعي يقرأ السير الذاتية...</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>هذا قد يستغرق دقيقة حسب عدد الملفات</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>نتائج المعالجة</h3>
          {results.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              {r.success
                ? <CheckCircle size={20} color="var(--success)" />
                : <AlertCircle size={20} color="var(--danger)" />}
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                {!r.success && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{r.error}</div>}
              </div>
              {r.success && <span className="badge badge-shortlisted" style={{ marginRight: 'auto' }}>تم الاستخراج ✓</span>}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <a href="/candidates" className="btn btn-primary btn-sm">عرض المرشحين ←</a>
          </div>
        </div>
      )}
    </div>
  )
}
