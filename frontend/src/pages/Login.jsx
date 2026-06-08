import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #2563a8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a3a5c', marginBottom: 4 }}>HIRING MO</div>
          <div style={{ fontSize: 15, color: '#64748b' }}>نظام إدارة التوظيف</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>روّاد الخليج للمدارس الدولية</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              className="form-control"
              type="email"
              placeholder="example@domain.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={18} /> تسجيل الدخول</>}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>بيانات تجريبية:</div>
          <div>HR: hr@hiringmo.com / admin123</div>
          <div>مشرفة: supervisor@hiringmo.com / super123</div>
          <div>مقابل: interviewer@hiringmo.com / inter123</div>
          <div style={{ marginTop: 6, color: '#94a3b8' }}>
            ملاحظة: شغّل <code>/api/auth/seed</code> أولاً لإنشاء الحسابات
          </div>
        </div>
      </div>
    </div>
  )
}
