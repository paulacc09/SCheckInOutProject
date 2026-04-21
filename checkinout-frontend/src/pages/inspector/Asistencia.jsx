import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function InspectorAsistencia() {
  const [cedula, setCedula] = useState('')
  const [jornada, setJornada] = useState(null)
  const [personal, setPersonal] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarJornada() }, [])

  async function cargarJornada() {
    try {
      const res = await api.get('/asistencia/jornada-activa')
      setJornada(res.data.data || null)
      if (res.data.data) cargarPersonal(res.data.data.obra_id)
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

  async function abrirJornada() {
    try {
      await api.post('/asistencia/abrir-jornada')
      cargarJornada()
    } catch (e) {
      mostrarMensaje(e.response?.data?.message || 'Error al abrir jornada', 'error')
    }
  }

  async function cerrarJornada() {
    if (!confirm('¿Cerrar jornada actual?')) return
    try {
      await api.post('/asistencia/cerrar-jornada', { jornada_id: jornada.id })
      setJornada(null)
      setPersonal([])
    } catch (e) {
      mostrarMensaje(e.response?.data?.message || 'Error al cerrar', 'error')
    }
  }

  async function registrar(tipo) {
    if (!cedula.trim()) return
    setCargando(true)
    try {
      const res = await api.post('/asistencia/registrar', {
        cedula,
        tipo,
        jornada_id: jornada?.id,
      })
      const nombre = res.data.data?.nombre || cedula
      const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      mostrarMensaje(
        `${tipo === 'ingreso' ? 'Ingreso' : 'Salida'} registrado correctamente\n${nombre} — ${hora} — ${jornada?.obra_nombre || ''}`,
        'success'
      )
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

  const presentes = personal.filter(p => p.estado === 'presente' || p.hora_ingreso).length
  const ausentes = personal.filter(p => !p.hora_ingreso).length

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-4">Asistencia</h2>

      {/* Banner obra activa */}
      <div className={`rounded-xl p-4 mb-6 ${jornada ? 'bg-[#1a3a5c]' : 'bg-gray-200'}`}>
        {jornada ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1">OBRA ACTIVA</p>
              <p className="text-white font-bold text-base">{jornada.obra_nombre} — {jornada.obra_ciudad}</p>
              <p className="text-blue-200 text-xs mt-1">
                Jornada iniciada hoy {new Date(jornada.hora_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —
                Responsable: {jornada.inspector_nombre}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-medium">Jornada abierta</span>
              <button onClick={cerrarJornada} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                Cerrar jornada
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">No hay jornada activa</p>
            <button onClick={abrirJornada} className="btn-primary text-sm">Abrir jornada</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Registrar asistencia */}
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
            <button
              className="flex-1 btn-secondary text-sm"
              onClick={() => registrar('ingreso')}
              disabled={!jornada || cargando}
            >
              Registrar Ingreso
            </button>
            <button
              className="flex-1 btn-secondary text-sm"
              onClick={() => registrar('salida')}
              disabled={!jornada || cargando}
            >
              Registrar salida
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center mb-2">— Biometría —</p>
            <button className="w-full btn-secondary text-sm" disabled={!jornada}>
              Registrar biométrico
            </button>
          </div>

          {/* Mensaje feedback */}
          {mensaje && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm whitespace-pre-line ${
              mensaje.tipo === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {mensaje.texto}
            </div>
          )}
        </div>

        {/* Personal en obra */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Personal en Obra</h3>
            <span className="bg-[#1a3a5c] text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {personal.length}
            </span>
          </div>

          <div className="overflow-x-auto">
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
                  <tr><td colSpan={4} className="table-cell text-center text-gray-400 py-6">Sin personal registrado</td></tr>
                ) : personal.slice(0, 8).map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell text-xs">{p.nombre} {p.apellido}</td>
                    <td className="table-cell text-xs">{p.cedula}</td>
                    <td className="table-cell text-xs">
                      {p.hora_ingreso
                        ? new Date(p.hora_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
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
      </div>
    </Layout>
  )
}