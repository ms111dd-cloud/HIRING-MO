import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Eye, CheckCircle, XCircle, Clock, Calendar, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const statusBadge = {
  new: <span className="badge badge-new">جديد</span>,
  shortlisted: <span className="badge badge-shortlisted">مناسب</span>,
  rejected: <span className="badge badge-rejected">مرفوض</span>,
  under_review: <span className="badge badge-review">قيد المراجعة</span>,
  interview_scheduled: <span className="badge badge-scheduled">مقابلة مجدولة</span>,
  accepted: <span className="badge badge-accepted">مقبول</span>,
  offer_issued: <span className="badge badge-offer">صدر عرض</span>,
}

export default function Candidates() {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [interviewForm, setInterviewForm] = useState({ jobTitle: '', scheduledAt: '', interviewerId: '', branchId: '' })
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [draftEmail, setDraftEmail] = useState(null)
  const [loadingEmail, setLoadingEmail] = useState(false)

  useEffect(() => {
    fetchData()
    axios.get('/api/auth/users').then(r => setUsers(r.data)).catch(() => {})
    axios.get('/api/branches').catch(() => {})
  }, [filterStatus])

  const fetchData = () => {
    setLoading(true)
    axios.get(`/api/candidates${filterStatus ? `?status=${filterStatus}` : ''}`)
      .then(r => setCandidates(r.data))
      .catch(() => toast.error('خطأ في تحميل البيانات'))
      .finally(() => setLoading(false))
  }

  const openModal = (candidate, type) => {
    setSelected(candidate)
    setModalType(type)
    setShowModal(true)
    setDraftEmail(null)
  }

  const handleEvaluate = async (decision) => {
    const notes = document.getElementById('eval-notes')?.value
    try {
      await axios.put(`/api/candidates/${selected.id}/evaluate`, { decision, notes })
      toast.success('تم حفظ التقييم')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('خطأ في الحفظ')
    }
  }

  const handleScheduleInterview = async () => {
    try {
      await axios.post('/api/interviews', { candidateId: selected.id, ...interviewForm })
      toast.success('تم جدولة المقابلة')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('خطأ في الجدولة')
    }
  }

  const getDraftEmail = async () => {
    setLoadingEmail(true)
    try {
      const interviewerName = users.find(u => u.id === interviewForm.interviewerId)?.name || ''
      const r = await axios.post('/api/interviews/draft-email', {
        candidateId: selected.id,
        interviewDate: interviewForm.scheduledAt,
        interviewerName,
        jobTitle: interviewForm.jobTitle,
        branch: branches.find(b => b.id === interviewForm.branchId)?.nameAr || '',
      })
      setDraftEmail(r.data)
    } catch {
      toast.error('خطأ في توليد الإيميل')
    } finally {
      setLoadingEmail(false)
    }
  }

  const interviewers = users.filter(u => u.role === 'interviewer')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">المرشحون</h1>
          <p className="page-subtitle">{candidates.length} مرشح</p>
        </div>
        <select className="form-control" style={{ width: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="new">جديد</option>
          <option value="shortlisted">مناسب</option>
          <option value="under_review">قيد المراجعة</option>
          <option value="rejected">مرفوض</option>
          <option value="interview_scheduled">مقابلة مجدولة</option>
          <option value="accepted">مقبول</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> :
          candidates.length === 0 ? (
            <div className="empty-state">
              <Eye />
              <h3>لا يوجد مرشحون</h3>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الجنسية</th>
                    <th>التخصص</th>
                    <th>الخبرة</th>
                    <th>الملاءمة</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                      </td>
                      <td>{c.nationality}</td>
                      <td>
                        <div>{c.major}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.subjectsTaught}</div>
                      </td>
                      <td>{c.yearsExperience} سنوات</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6, minWidth: 60 }}>
                            <div style={{ background: c.fitScore > 70 ? 'var(--success)' : c.fitScore > 40 ? 'var(--warning)' : 'var(--danger)', borderRadius: 4, height: 6, width: `${c.fitScore || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, minWidth: 28 }}>{c.fitScore}%</span>
                        </div>
                      </td>
                      <td>{statusBadge[c.status] || c.status}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal(c, 'view')}>
                            <Eye size={14} /> عرض
                          </button>
                          {user.role === 'academic_supervisor' && c.status === 'new' && (
                            <button className="btn btn-primary btn-sm" onClick={() => openModal(c, 'evaluate')}>
                              تقييم
                            </button>
                          )}
                          {user.role === 'hr_manager' && c.status === 'shortlisted' && (
                            <button className="btn btn-success btn-sm" onClick={() => openModal(c, 'schedule')}>
                              <Calendar size={14} /> جدولة
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {showModal && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>
                {modalType === 'view' ? selected.fullName :
                  modalType === 'evaluate' ? `تقييم: ${selected.fullName}` :
                    `جدولة مقابلة: ${selected.fullName}`}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body">

              {/* VIEW */}
              {modalType === 'view' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      ['الجنسية', selected.nationality], ['المؤهل', selected.qualification],
                      ['التخصص', selected.major], ['سنوات الخبرة', `${selected.yearsExperience} سنوات`],
                      ['آخر وظيفة', selected.lastJob], ['الدولة الحالية', selected.currentCountry],
                      ['الجوال', selected.phone], ['البريد', selected.email],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</div>
                        <div style={{ fontWeight: 500, fontSize: 14, marginTop: 2 }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>ملخص الذكاء الاصطناعي</div>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>{selected.summary}</p>
                  </div>
                  {selected.cvFilePath && (
                    <a href={`/uploads/cvs/${selected.cvFilePath}`} target="_blank" className="btn btn-outline btn-sm">
                      <Eye size={14} /> معاينة السيرة الذاتية
                    </a>
                  )}
                </div>
              )}

              {/* EVALUATE */}
              {modalType === 'evaluate' && (
                <div>
                  <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>{selected.summary}</p>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      الملاءمة: {selected.fitScore}% — {selected.fitNotes}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ملاحظات التقييم (اختياري)</label>
                    <textarea id="eval-notes" className="form-control" rows={3} placeholder="أضف ملاحظاتك..." />
                  </div>
                </div>
              )}

              {/* SCHEDULE */}
              {modalType === 'schedule' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">المسمى الوظيفي</label>
                    <input className="form-control" value={interviewForm.jobTitle} onChange={e => setInterviewForm({ ...interviewForm, jobTitle: e.target.value })} placeholder="معلم رياضيات..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">موعد المقابلة</label>
                    <input type="datetime-local" className="form-control" value={interviewForm.scheduledAt} onChange={e => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">المقابل</label>
                    <select className="form-control" value={interviewForm.interviewerId} onChange={e => setInterviewForm({ ...interviewForm, interviewerId: e.target.value })}>
                      <option value="">اختر المقابل</option>
                      {interviewers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  {draftEmail && (
                    <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>مسودة الإيميل:</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{draftEmail.subject}</div>
                      <textarea className="form-control" rows={5} defaultValue={draftEmail.body} style={{ marginTop: 8, fontSize: 13 }} />
                    </div>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={getDraftEmail} disabled={loadingEmail} style={{ marginTop: 8 }}>
                    {loadingEmail ? 'جارٍ التوليد...' : '✨ توليد إيميل دعوة'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {modalType === 'evaluate' && (
                <>
                  <button className="btn btn-success" onClick={() => handleEvaluate('suitable')}><CheckCircle size={16} /> مناسب للمقابلة</button>
                  <button className="btn btn-warning" onClick={() => handleEvaluate('needs_review')}><Clock size={16} /> يحتاج مراجعة</button>
                  <button className="btn btn-danger" onClick={() => handleEvaluate('unsuitable')}><XCircle size={16} /> غير مناسب</button>
                </>
              )}
              {modalType === 'schedule' && (
                <button className="btn btn-primary" onClick={handleScheduleInterview}><Calendar size={16} /> تأكيد الجدولة</button>
              )}
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
