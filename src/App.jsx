import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { RotaPrivada, RotaAdmin } from './components/layout/Rotas'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Grupos from './pages/Grupos'
import Partidas from './pages/Partidas'
import Bolao from './pages/Bolao'
import Ranking from './pages/Ranking'
import Admin from './pages/admin/Admin'

function PageWithLayout({ children }) {
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas sem layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Com layout */}
          <Route path="/" element={<PageWithLayout><Navigate to="/grupos" replace /></PageWithLayout>} />
          <Route path="/grupos" element={<PageWithLayout><Grupos /></PageWithLayout>} />
          <Route path="/partidas" element={<PageWithLayout><Partidas /></PageWithLayout>} />
          <Route path="/ranking" element={<PageWithLayout><Ranking /></PageWithLayout>} />

          <Route path="/bolao" element={
            <PageWithLayout>
              <RotaPrivada><Bolao /></RotaPrivada>
            </PageWithLayout>
          } />

          <Route path="/admin" element={
            <PageWithLayout>
              <RotaAdmin><Admin /></RotaAdmin>
            </PageWithLayout>
          } />

          <Route path="*" element={<Navigate to="/grupos" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
