import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuAdmin = [
  { to: '/admin/obras', label: 'Mis Obras' },
  { to: '/admin/personal', label: 'Gestión Personal' },
  { to: '/admin/asistencias', label: 'Asistencias' },
  { to: '/admin/reportes', label: 'Reportes' },
  { to: '/admin/dispositivos', label: 'Dispositivos' },
  { to: '/admin/documentos', label: 'Documentos' },
]

const menuInspector = [
  { to: '/inspector/asistencia', label: 'Asistencia' },
  { to: '/inspector/personal', label: 'Personal en obra' },
  { to: '/inspector/novedades', label: 'Novedades' },
  { to: '/inspector/reportes', label: 'Reportes' },
  { to: '/inspector/documentos', label: 'Documentos' },
]

const menuEncargado = [
  { to: '/encargado/asistencia', label: 'Asistencia' },
  { to: '/encargado/personal', label: 'Personal en obra' },
  { to: '/encargado/novedades', label: 'Novedades' },
  { to: '/encargado/traspasos', label: 'Traspasos' },
]

const rolesMenu = {
  administrador: menuAdmin,
  inspector_sst: menuInspector,
  encargado: menuEncargado,
}

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const menu = rolesMenu[usuario?.rol] || []

  const perfilPath = usuario?.rol === 'administrador'
    ? '/admin/perfil'
    : usuario?.rol === 'inspector_sst'
    ? '/inspector/perfil'
    : '/encargado/perfil'

  const configPath = usuario?.rol === 'administrador' ? '/admin/configuracion' : null

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full bg-[#2d5fa6] flex items-center justify-center">
            <span className="text-white text-xs font-bold text-center leading-tight">CHECK<br/>INOUT</span>
          </div>
          <span className="text-[11px] text-gray-500 text-center leading-tight mt-1">
            Control de Asistencia y Personal<br/>en Obras de Construcción
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#2d5fa6] text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {configPath && (
          <NavLink
            to={configPath}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-[#2d5fa6] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            Configuración
          </NavLink>
        )}
      </div>
    </aside>
  )
}