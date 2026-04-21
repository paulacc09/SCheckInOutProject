import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const rolesLabel = {
  administrador: 'ADMINISTRATIVO',
  inspector_sst: 'INSPECTOR SST',
  encargado: 'ENCARGADO',
}

export default function TopBar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const rolLabel = rolesLabel[usuario?.rol] || ''
  const perfilPath = usuario?.rol === 'administrador'
    ? '/admin/perfil'
    : usuario?.rol === 'inspector_sst'
    ? '/inspector/perfil'
    : '/encargado/perfil'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-gray-700 tracking-wide">
        CHECKINOUT — {rolLabel}
      </h1>
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"
          onClick={() => {
            if (usuario?.rol === 'administrador') navigate('/admin/notificaciones')
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        {/* Perfil */}
        <button
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"
          onClick={() => navigate(perfilPath)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </header>
  )
}