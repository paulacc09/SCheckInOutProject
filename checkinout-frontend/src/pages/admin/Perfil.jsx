import { useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminPerfil() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalPass, setModalPass] = useState(false)

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : 'AD'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      {/* Header perfil */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white text-xl font-bold">
            {iniciales}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <p className="text-sm text-gray-500">
              Administrador — Mega Construcciones Jiménez SAS
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setModalPerfil(true)}
                className="text-xs text-gray-500 underline hover:text-[#2d5fa6]"
              >
                Editar perfil
              </button>
              <button
                onClick={() => setModalPass(true)}
                className="text-xs text-gray-500 underline hover:text-[#2d5fa6]"
              >
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Info personal */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Información personal</h3>
          <div className="space-y-3">
            {[
              ['Nombre Completo', `${usuario?.nombre || ''} ${usuario?.apellido || ''}`],
              ['Número de documento', usuario?.cedula || '1008795123'],
              ['Correo', usuario?.email || ''],
              ['Teléfono', usuario?.telefono || '+57 313 1234567'],
            ].map(([l, v]) => (
              <div key={l}>
                <label className="block text-xs text-gray-400 mb-0.5">{l}</label>
                <input className="input-field bg-gray-50" defaultValue={v} readOnly />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Rol y acceso */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rol y acceso</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rol</span>
                <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">Administrador</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Permisos</span>
                <span className="font-medium">Acceso total</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Último acceso</span>
                <span className="font-medium">Hoy 8:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="badge-activo">Activo</span>
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Actividad reciente</h3>
            <div className="space-y-2 text-sm">
              {[['Obras gestionadas','30'],['Reportes generados','20'],['Usuarios creados','15']].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500 underline">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Perfil */}
      {modalPerfil && (
        <Modal titulo="Editar Perfil" subtitulo="Actualiza tu información personal" onClose={() => setModalPerfil(false)}>
          <div className="flex gap-4 items-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg">
              {iniciales}
            </div>
            <div>
              <p className="font-semibold text-sm">{usuario?.nombre} {usuario?.apellido}</p>
              <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">Administrador</span>
              <p className="text-xs text-[#2d5fa6] underline cursor-pointer mt-1">Cambiar foto de perfil</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombres</label>
                <input className="input-field" defaultValue={usuario?.nombre} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos</label>
                <input className="input-field" defaultValue={usuario?.apellido} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nº documento</label>
              <input className="input-field bg-gray-50" defaultValue={usuario?.cedula || '157895482'} readOnly />
              <p className="text-xs text-gray-400 mt-0.5">(No editable)</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input className="input-field" defaultValue="+57 313 5789413" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
              <input className="input-field" defaultValue={usuario?.email} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary">Guardar</button>
          </div>
        </Modal>
      )}

      {/* Modal Cambiar Contraseña */}
      {modalPass && (
        <Modal titulo="Cambiar contraseña" subtitulo="Por seguridad, ingresa tu contraseña actual" onClose={() => setModalPass(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
              <input type="password" className="input-field" placeholder="••••••••••••" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
              <input type="password" className="input-field" placeholder="••••••••••••" />
              <p className="text-xs text-gray-400 mt-0.5">Mínimo 8 caracteres — Al menos un carácter especial</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
              <input type="password" className="input-field" placeholder="••••••••••••" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary">Guardar</button>
          </div>
        </Modal>
      )}
    </Layout>
  )
}