import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import {
  LayoutDashboard, Upload, Users, CalendarCheck,
  FileText, FolderOpen, Bell, LogOut, ChevronDown
} from 'lucide-react'

const roleNames = {
  hr_manager: 'مسؤول الموارد البشرية',
  academic_supervisor: 'المشرفة الأكاديمية',
  interviewer: 'المقابل',
  admin: 'مدير النظام'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    fetchNotifs()
    const t = setInterval(fetchNotifs, 30000)
    return () => clearInterval(t)
  }, [])

  const fetchNotifs = () => {
    axios.get('/api/notifications').then(r => setNotifs(r.data)).catch(() => {})
  }

  const unread = notifs.filter(n => !n.isRead).length

  const markRead = async (id) => {
    await axios.put(`/api/notifications/${id}/read`)
    fetchNotifs()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: <LayoutDashboard />, label: 'لوحة التحكم', exact: true },
    { to: '/upload', icon: <Upload />, label: 'رفع السير الذاتية', roles: ['hr_manager', 'admin'] },
    { to: '/candidates', icon: <Users />, label: 'المرشحون' },
    { to: '/interviews', icon: <CalendarCheck />, label: 'جدول المقابلات' },
    { to: '/offers', icon: <FileText />, label: 'العروض الوظيفية', roles: ['hr_manager', 'admin'] },
    { to: '/templates', icon: <FolderOpen />, label: 'القوالب', roles: ['hr_manager', 'admin'] },
  ].filter(item => !item.roles || item.roles.includes(user?.role))

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>HIRING MO</h2>
          <p>نظام إدارة التوظيف</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>
            <div style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>{user?.name}</div>
            {roleNames[user?.role]}
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ padding: '8px 0', color: 'rgba(255,255,255,0.6)' }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            روّاد الخليج للمدارس الدولية
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, position: 'relative' }}
              >
                <Bell size={20} color="var(--text-muted)" />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotifs && (
                <div style={{
                  position: 'absolute', left: 0, top: 40, width: 320, background: 'white',
                  border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 300, maxHeight: 400, overflow: 'auto'
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
                    الإشعارات
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>لا توجد إشعارات</div>
                  ) : notifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        background: n.isRead ? 'white' : '#eff6ff', cursor: 'pointer', fontSize: 14
                      }}
                    >
                      <div style={{ fontWeight: n.isRead ? 400 : 600 }}>{n.message}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
