import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FolderOpen, Upload, Trash2 } from 'lucide-react'

const typeNames = { offer_ar: 'عرض وظيفي عربي', offer_en: 'عرض وظيفي إنجليزي', interview_invite: 'دعوة مقابلة', rejection: 'رفض مرشح', docs_request: 'طلب مستندات' }

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nameAr: '', type: 'offer_ar' })
  const [file, setFile] = useState(null)
  const inputRef = useRef()

  useEffect(() => { fetchData() }, [])
  const fetchData = () => {
    axios.get('/api/templates').then(r => setTemplates(r.data)).finally(() => setLoading(false))
  }

  const handleUpload = async () => {
    if (!file || !form.nameAr) return toast.error('أدخل اسم القالب واختر الملف')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('nameAr', form.nameAr)
    fd.append('type', form.type)
    try {
      await axios.post('/api/templates', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('تم رفع القالب')
      setForm({ nameAr: '', type: 'offer_ar' })
      setFile(null)
      fetchData()
    } catch { toast.error('خطأ في الرفع') }
  }

  const handleDelete = async (id) => {
    if (!confirm('حذف القالب؟')) return
    await axios.delete(`/api/templates/${id}`)
    toast.success('تم الحذف')
    fetchData()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">القوالب</h1>
        <p className="page-subtitle">إدارة قوالب الـ Word المستخدمة في النظام</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>رفع قالب جديد</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, background: '#fffbeb', padding: '10px 14px', borderRadius: 8 }}>
          💡 في ملف Word، استخدم هذه المتغيرات: <code>{'{{CANDIDATE_NAME}}'}</code> <code>{'{{JOB_TITLE}}'}</code> <code>{'{{TOTAL_SALARY}}'}</code> <code>{'{{START_DATE}}'}</code> <code>{'{{BRANCH}}'}</code> <code>{'{{DATE_TODAY}}'}</code>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">اسم القالب</label>
            <input className="form-control" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="عرض وظيفي للمعلمين..." />
          </div>
          <div className="form-group">
            <label className="form-label">نوع القالب</label>
            <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.entries(typeNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> {file ? file.name : 'اختر ملف Word'}
          </button>
          <input ref={inputRef} type="file" accept=".docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          <button className="btn btn-primary" onClick={handleUpload}>رفع القالب</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>القوالب المتاحة</h3>
        {templates.length === 0 ? (
          <div className="empty-state"><FolderOpen /><h3>لا توجد قوالب بعد</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>اسم القالب</th><th>النوع</th><th>تاريخ الرفع</th><th>حذف</th></tr></thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.nameAr}</td>
                    <td><span className="badge badge-scheduled">{typeNames[t.type] || t.type}</span></td>
                    <td style={{ fontSize: 13 }}>{new Date(t.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
