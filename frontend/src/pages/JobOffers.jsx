import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FileText, Download, Plus } from 'lucide-react'

export default function JobOffers() {
  const [offers, setOffers] = useState([])
  const [ready, setReady] = useState([])
  const [templates, setTemplates] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [form, setForm] = useState({ branchId: '', jobTitle: '', basicSalary: '', housingAllowance: '', transportAllowance: '', totalSalary: '', startDate: '', probationPeriod: '3 أشهر', contractType: 'سنوي', extraBenefits: '', templateId: '' })

  useEffect(() => {
    Promise.all([
      axios.get('/api/offers'),
      axios.get('/api/offers/ready'),
      axios.get('/api/templates'),
    ]).then(([o, r, t]) => {
      setOffers(o.data)
      setReady(r.data)
      setTemplates(t.data)
    }).finally(() => setLoading(false))
  }, [])

  const f = form
  const total = (parseInt(f.basicSalary || 0) + parseInt(f.housingAllowance || 0) + parseInt(f.transportAllowance || 0)).toString()

  const handleCreate = async () => {
    try {
      const { data } = await axios.post('/api/offers', { candidateId: selectedCandidate.id, ...form, totalSalary: total })
      toast.success('تم إنشاء العرض الوظيفي')
      if (data.downloadUrl) window.open(data.downloadUrl)
      setShowModal(false)
      const [o, r] = await Promise.all([axios.get('/api/offers'), axios.get('/api/offers/ready')])
      setOffers(o.data)
      setReady(r.data)
    } catch {
      toast.error('خطأ في إنشاء العرض')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">العروض الوظيفية</h1>
        <p className="page-subtitle">إنشاء وإدارة عروض التوظيف</p>
      </div>

      {ready.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderRight: '4px solid var(--success)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--success)' }}>✓ جاهزون للعرض الوظيفي ({ready.length})</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {ready.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', padding: '10px 16px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{c.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.major}</div>
                </div>
                <button className="btn btn-success btn-sm" onClick={() => { setSelectedCandidate(c); setShowModal(true) }}>
                  <Plus size={14} /> إنشاء عرض
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">العروض الصادرة ({offers.length})</h3>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> :
          offers.length === 0 ? (
            <div className="empty-state"><FileText /><h3>لا توجد عروض بعد</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>المرشح</th><th>الوظيفة</th><th>الراتب الإجمالي</th><th>تاريخ المباشرة</th><th>تاريخ الإصدار</th><th>تحميل</th></tr>
                </thead>
                <tbody>
                  {offers.map(o => (
                    <tr key={o.id}>
                      <td><div style={{ fontWeight: 500 }}>{o.candidate?.fullName}</div></td>
                      <td>{o.jobTitle}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{parseInt(o.totalSalary || 0).toLocaleString()} ريال</td>
                      <td>{o.startDate ? new Date(o.startDate).toLocaleDateString('ar-SA') : '—'}</td>
                      <td style={{ fontSize: 13 }}>{new Date(o.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td>
                        {o.generatedFile ? (
                          <a href={`/api/offers/${o.id}/download`} className="btn btn-primary btn-sm">
                            <Download size={14} /> تحميل Word
                          </a>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>بدون قالب</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {showModal && selectedCandidate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>إنشاء عرض وظيفي: {selectedCandidate.fullName}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">المسمى الوظيفي</label>
                  <input className="form-control" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع العقد</label>
                  <select className="form-control" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                    <option>سنوي</option><option>نصف سنوي</option><option>مؤقت</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">الراتب الأساسي</label>
                  <input className="form-control" type="number" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">بدل السكن</label>
                  <input className="form-control" type="number" value={form.housingAllowance} onChange={e => setForm({ ...form, housingAllowance: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">بدل النقل</label>
                  <input className="form-control" type="number" value={form.transportAllowance} onChange={e => setForm({ ...form, transportAllowance: e.target.value })} />
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
                إجمالي الراتب: {parseInt(total || 0).toLocaleString()} ريال
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">تاريخ المباشرة</label>
                  <input className="form-control" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">مدة التجربة</label>
                  <input className="form-control" value={form.probationPeriod} onChange={e => setForm({ ...form, probationPeriod: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">قالب العرض</label>
                <select className="form-control" value={form.templateId} onChange={e => setForm({ ...form, templateId: e.target.value })}>
                  <option value="">بدون قالب</option>
                  {templates.filter(t => t.type?.includes('offer')).map(t => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">مزايا إضافية</label>
                <textarea className="form-control" rows={2} value={form.extraBenefits} onChange={e => setForm({ ...form, extraBenefits: e.target.value })} placeholder="تذاكر سفر، تأمين طبي..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={handleCreate}><FileText size={16} /> إنشاء وتحميل Word</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
