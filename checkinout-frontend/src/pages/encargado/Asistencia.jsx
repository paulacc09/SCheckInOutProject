import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function EncargadoAsistencia() {
  const [cedula, setCedula] = useState('')
  const [jornada, setJornada] = useState(null)
  const [personal, setPersonal] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarJornada() }, [])

  async function cargarJornada() {
    try {
      const res = await api.get('/asistencia/jornada-activa')
      const j = res.data.data
      setJornada(j)
      if (j) cargarPersonal(j.obra_id)
    } catch {
      setJornada(null)
    }
  }

  async function cargarPersonal(obraId) {
    try {
      const res = await api.get(`/asistencia/personal-obra/${obraId}`)
      setPersonal(res.data.data || [])
    } catch {
      setPersonal([])
    }
  }

  async function registrar(tipo) {
    if (!cedula.trim()) return
    setCargando(true)
    try {
      const res = await api.post('/asistencia/registrar', {
        cedula, tipo, jornada_id: jornada?.id,
      })
      const nombre = res.data.data?.nombre || cedula
      const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      mostrarMensaje(`${tipo === 'ingreso' ? 'Ingreso' : 'Salida'} registrado\n${nombre} — ${hora}`, 'success')
      setCedula('')
      if (jornada) cargarPersonal(jornada.obra_id)
    } catch (e) {
      mostrarMensaje(e.response?.data?.message || 'Trabajador no encontrado', 'error')
    } finally {
      setCargando(false)
    }
  }

  function mostrarMensaje(texto, tipo) {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 4000)
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Asistencia</h2>
        {jornada && (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            No posee permiso de administración para hacer cambios en esta pestaña
          </span>
        )}
      </div>

      {/* Banner obra */}
      <div className={`rounded-xl p-4 mb-6 ${jornada ? 'bg-[#1a3a5c]' : 'bg-gray-100'}`}>
        {jornada ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1">OBRA ACTIVA</p>
              <p className="text-white font-bold">{jornada.obra_nombre} — {jornada.obra_ciudad}</p>
              <p className="text-blue-200 text-xs mt-1">
                Jornada iniciada hoy {new Date(jornada.hora_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —
                Responsable: {jornada.inspector_nombre}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-medium">Jornada abierta</span>
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition-colors">
                Cerrar jornada
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center">No hay jornada activa en tu obra asignada</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Formulario registro */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Registrar asistencia</h3>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Nº Documento trabajador</label>
            <input
              className="input-field"
              placeholder="Escribe"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registrar('ingreso')}
              disabled={!jornada}
            />
          </div>
          <div className="flex gap-2 mb-4">
            <button className="flex-1 btn-secondary text-sm" onClick={() => registrar('ingreso')} disabled={!jornada || cargando}>
              Registrar Ingreso
            </button>
            <button className="flex-1 btn-secondary text-sm" onClick={() => registrar('salida')} disabled={!jornada || cargando}>
              Registrar salida
            </button>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center mb-2">— Biometría —</p>
            <button className="w-full btn-secondary text-sm" disabled={!jornada}>Registrar biométrico</button>
          </div>
          {mensaje && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm whitespace-pre-line ${
              mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}
          {!mensaje && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-gray-100 text-gray-400 text-sm">
              No ha ingresado trabajadores
            </div>
          )}
        </div>

        {/* Personal */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Personal en Obra</h3>
            <span className="bg-[#1a3a5c] text-white text-xs px-2 py-0.5 rounded-full">{personal.length}</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header text-xs">Trabajador</th>
                <th className="table-header text-xs">Documento</th>
                <th className="table-header text-xs">Ingreso</th>
                <th className="table-header text-xs">Estado</th>
              </tr>
            </thead>
            <tbody>
              {personal.length === 0 ? (
                <tr><td colSpan={4} className="table-cell text-center text-gray-400 py-6">Sin personal</td></tr>
              ) : personal.slice(0, 8).map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell text-xs">{p.nombre} {p.apellido}</td>
                  <td className="table-cell text-xs">{p.cedula}</td>
                  <td className="table-cell text-xs">
                    {p.hora_ingreso ? new Date(p.hora_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="table-cell text-xs">
                    <span className={p.hora_ingreso ? 'badge-presente' : 'badge-ausente'}>
                      {p.hora_ingreso ? 'Presente' : 'Ausente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}