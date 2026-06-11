import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Tenta os dois storages ao carregar
function getStored(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getStored('token')
    const nome  = getStored('nome')
    const email = getStored('email')
    const role  = getStored('role')
    if (token && nome) setUser({ token, nome, email, role })
    setLoading(false)
  }, [])

  const login = (data, lembrar = true) => {
    const storage = lembrar ? localStorage : sessionStorage
    // Limpar o outro storage para evitar duplicata
    ;['token', 'nome', 'email', 'role'].forEach(k => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })
    storage.setItem('token', data.token)
    storage.setItem('nome',  data.nome)
    storage.setItem('email', data.email)
    storage.setItem('role',  data.role)
    setUser(data)
  }

  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)