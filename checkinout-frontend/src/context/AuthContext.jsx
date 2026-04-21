import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('usuario')

    if (token && user) {
      try {
        setUsuario(JSON.parse(user))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
      }
    }

    setCargando(false)
  }, [])

  // 🔥 LOGIN CORREGIDO
  async function login(email, password) {
    const res = await api.post('/auth/login', {
      email,
      password
    })

    const { token, usuario: user } = res.data.data

    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(user))

    setUsuario(user)

    return user
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {!cargando && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}