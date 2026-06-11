import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-yellow-500 text-gray-900'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-white text-lg hidden sm:block">Bolão Copa 2026</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navLink('/grupos', '🌍 Grupos')}
              {navLink('/partidas', '⚽ Partidas')}
              {user && navLink('/bolao', '🎯 Bolão')}
              {navLink('/ranking', '🏅 Ranking')}
              {user?.role === 'ADMIN' && navLink('/admin', '⚙️ Admin')}
            </div>

            {/* User area */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-400 hidden sm:block">
                    Olá, <span className="text-white font-medium">{user.nome.split(' ')[0]}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    className="text-sm bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
