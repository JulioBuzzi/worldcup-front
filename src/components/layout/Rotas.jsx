import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RotaPrivada({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" /></div>
  return user ? children : <Navigate to="/login" replace />
}

export function RotaAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}
