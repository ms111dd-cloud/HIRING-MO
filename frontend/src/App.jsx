import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CVUpload from './pages/CVUpload'
import Candidates from './pages/Candidates'
import Interviews from './pages/Interviews'
import JobOffers from './pages/JobOffers'
import Templates from './pages/Templates'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<ProtectedRoute roles={['hr_manager','admin']}><CVUpload /></ProtectedRoute>} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="offers" element={<ProtectedRoute roles={['hr_manager','admin']}><JobOffers /></ProtectedRoute>} />
        <Route path="templates" element={<ProtectedRoute roles={['hr_manager','admin']}><Templates /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Tajawal, sans-serif', direction: 'rtl' } }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
