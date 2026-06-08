import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { CalendarCheck, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Interviews() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ result: '', notes: '', rating: 3 })

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
    axios.get('/api/interviews').then(r => setInterviews(r.data)).finally(() => setLoading(false))
  }

  const handleResult = async () => {
    if (!form.result) return toast.error('اختر النتيجة')
    try {
      await axios.put(`/api/interviews/${selected.id}/result`, form)
      toast.success('تم حفظ نتيجة المقابلة')
      setSelected(null)
      fetchData()
    } catch {
      toast.error('خطأ في الحفظ')
    }
  }

  const resultBadge = {
    accepted: <span className="badge badge-accepted">مقبول</span>,
    rejected: <span className="badge badge-rejected">مرفوض</span>,
    reserve: <span className="badge badge-review">احتياط</span>,
    second_interview: <span className="badge badge-scheduled">مقابلة ثانية</span>,
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">جدول المقابلات</h1>
        <p className="page-subtitle">{interviews.length} مقابلة</p>
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> :
          interviews.length === 0 ? (
            <div className="empty-state"><CalendarCheck /><h3>لا توجد مقابلات مجدولة</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المرشح</th>
                    <th>الوظيفة</th>
                    <th>المقابل</th>
                    <th>الموعد</th>
                    <th>الحالة</th>
                    <th>النتيجة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map(i => (
                    <tr key={i.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{i.candidate?.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.candidate?.nationality}</div>
                      </td>
                      <td>{i.jobTitle}</td>
                      <td>{i.interviewer?.name}</td>
                      <td style={{ fontSize: 13 }}>
                        {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString('ar-SA') : '—'}
                      </td>
                      <td>
                        {i.status === 'scheduled'
                          ? <span className="badge badge-scheduled">مجدولة</span>
                          : <span className="badge badge-accepted">منتهية</span>}
                      </td>
                      <td>{i.result ? resultBadge[i.result] : '—'}</td>
                      <td>
                        {i.status === 'scheduled' && (user.role === 'interviewer' || user.role === 'hr_manager' || user.role === 'admin') && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelected(i); setForm({ result: '', notes: '', rating: 3 }) }}>
                            تسجيل النتيجة
                          </button>
                        )}
                        {i.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{i.notes}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>نتيجة مقابلة: {selected.candidate?.fullName}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">النتيجة</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['accepted','مقبول','success'], ['rejected','مرفوض','danger'], ['reserve','احتياط','warning'], ['second_interview','مقابلة ثانية','info']].map(([v, l, c]) => (
                    <button key={v} onClick={() => setForm({ ...form, result: v })}
                      style={{ padding: '12px', borderRadius: 8, border: `2px solid ${form.result === v ? `var(--${c})` : 'var(--border)'}`, background: form.result === v ? `var(--${c})` : 'white', color: form.result === v ? 'white' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">التقييم العام</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: n <= form.rating ? '#c9a227' : 'var(--border)' }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات المقابل</label>
                <textarea className="form-control" rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="أدخل ملاحظاتك وتقييمك للمرشح..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleResult}>حفظ النتيجة</button>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
