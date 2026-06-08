import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, FileText, CalendarCheck, CheckCircle, XCircle, Upload, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  if (!stats) return <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" /></div>

  const cards = [
    { label: 'إجمالي السير', value: stats.totalCVs, icon: <Upload />, color: '#eff6ff', iconColor: '#2563a8' },
    { label: 'مرشحون مناسبون', value: stats.shortlisted, icon: <Users />, color: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'مقابلات مجدولة', value: stats.interviewsScheduled, icon: <CalendarCheck />, color: '#fff7ed', iconColor: '#d97706' },
    { label: 'مقبولون', value: stats.accepted, icon: <CheckCircle />, color: '#f0fdf4', iconColor: '#15803d' },
    { label: 'مرفوضون', value: stats.rejected, icon: <XCircle />, color: '#fef2f2', iconColor: '#dc2626' },
    { label: 'عروض وظيفية', value: stats.offersIssued, icon: <FileText />, color: '#faf5ff', iconColor: '#7c3aed' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">مرحباً، {user?.name} 👋</h1>
        <p className="page-subtitle">ملخص عمليات التوظيف</p>
      </div>

      <div className="stats-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: c.color, color: c.iconColor }}>
              {c.icon}
            </div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">توزيع المرشحين حسب الحالة</h3>
          </div>
          {Object.entries(stats.byStatus || {}).map(([k, v]) => {
            const statusMap = { new: 'جديد', shortlisted: 'مناسب', rejected: 'مرفوض', under_review: 'قيد المراجعة', interview_scheduled: 'مقابلة مجدولة', accepted: 'مقبول', offer_issued: 'صدر عرض' }
            const total = stats.totalCVs || 1
            return (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{statusMap[k] || k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                  <div style={{ background: 'var(--primary-light)', borderRadius: 4, height: 6, width: `${Math.round(v / total * 100)}%`, transition: 'width .5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">الجنسيات الأكثر تقديماً</h3>
          </div>
          {Object.entries(stats.byNationality || {}).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span>{k}</span>
              <span style={{ background: '#eff6ff', color: '#2563a8', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {Object.keys(stats.byNationality || {}).length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>لا توجد بيانات بعد</div>
          )}
        </div>
      </div>
    </div>
  )
}
