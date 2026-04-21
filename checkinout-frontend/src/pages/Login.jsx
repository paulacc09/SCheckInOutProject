import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { id: 'administrador', label: 'Administrador' },
  { id: 'inspector_sst', label: 'Inspector SST' },
  { id: 'encargado', label: 'Encargado' },
]

export default function Login() {
  const [rol, setRol] = useState('administrador')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
  e.preventDefault()
  setError('')
  setCargando(true)

  try {
    const user = await login(email, password) 

    if (user.rol === 'administrador') navigate('/admin/obras')
    else if (user.rol === 'inspector_sst') navigate('/inspector/asistencia')
    else if (user.rol === 'encargado') navigate('/encargado/asistencia')

  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Credenciales incorrectas'
    )
  } finally {
    setCargando(false)
  }
}

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="w-[45%] bg-[#b8c8d8] flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="w-40 h-40 rounded-full border-4 border-[#2d5fa6] bg-white/20 flex items-center justify-center mb-4">
          <div className="text-center">
            <div className="text-[#1a3a5c] font-black text-xl tracking-widest">CHECK</div>
            <div className="text-[#1a3a5c] font-black text-xl tracking-widest">INOUT</div>
          </div>
        </div>
        <h2 className="text-[#1a3a5c] font-black text-2xl tracking-wide">CheckInOut</h2>
        <p className="text-[#1a3a5c]/70 text-sm text-center mt-1 leading-relaxed">
          Control de Asistencia y Personal<br />en Obras de Contrucción
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Iniciar Sesión</h1>
          <p className="text-sm text-gray-500 mb-6">Selecciona tu rol para continuar</p>

          {/* Selector rol */}
          <div className="flex gap-2 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRol(r.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  rol === r.id
                    ? 'bg-[#2d5fa6] text-white border-[#2d5fa6]'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full btn-primary py-2.5 disabled:opacity-50"
            >
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <p className="text-center text-xs text-[#2d5fa6] hover:underline cursor-pointer">
              ¿Olvidaste tu contraseña?
            </p>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              className="w-full btn-secondary py-2.5"
            >
              Continuar con Google
            </button>

            <p className="text-center text-xs text-gray-400">
              ¿No tienes cuenta?{' '}
              <span className="text-[#2d5fa6] hover:underline cursor-pointer">
                Registrar Empresa
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}