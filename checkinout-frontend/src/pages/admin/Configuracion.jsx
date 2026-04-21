import { useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminConfiguracion() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [notif, setNotif] = useState({
    ausencias: true, dispositivos: true, reportes: false, novedades: true, biometria: true
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-6">Configuración del Sistema</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Empresa */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Información de la empresa</h3>
          <div className="space-y-3">
            {[['Nombre de la empresa','Mega Construcciones Jiménez SAS'],['NIT','900.123.123-0'],['Correo','admin@megaconstrucciones.com'],['Teléfono','+57 313 1234567']].map(([l,v]) => (
              <div key={l}>
                <label className="block text-xs text-gray-500 mb-1">{l}</label>
                <input className="input-field" defaultValue={v} />
              </div>
            ))}
            <button className="btn-secondary text-sm mt-2">Guardar Cambios</button>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Horario jornada laboral</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                <input className="input-field" defaultValue="06:00 AM" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora cierre</label>
                <input className="input-field" defaultValue="18:00 PM" />
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Notificaciones y alertas</h3>
          <div className="space-y-4">
            {[
              ['ausencias','Notificar ausencias','Alerta al admin si un trabajador no asiste'],
              ['dispositivos','Notificar nuevos dispositivos','Alerta cuando se conecta un dispositivo nuevo'],
              ['reportes','Reportes automáticos','Generar reporte semanal al correo'],
              ['novedades','Novedades pendientes','Recordar novedades sin revisar'],
              ['biometria','Autenticación biométrica','Habilitar registro con biometría'],
            ].map(([key, label, desc]) => (
              <div key={key} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => setNotif(p => ({...p, [key]: !p[key]}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notif[key] ? 'bg-[#2d5fa6]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${notif[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-red-400 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            ↪ Cerrar Sesion
          </button>
        </div>
      </div>
    </Layout>
  )
}