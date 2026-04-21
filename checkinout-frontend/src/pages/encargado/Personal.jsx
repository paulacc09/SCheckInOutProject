import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function EncargadoPersonal() {
  const [personal, setPersonal] = useState([])
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [jornada, setJornada] = useState(null)

  useEffect(() => { cargarJornada() }, [])

  async function cargarJornada() {
    try {
      const res = await api.get('/asistencia/jornada-activa')
      const j = res.data.data
      setJornada(j)
      if (j) {
        const res2 = await api.get(`/asistencia/personal-obra/${j.obra_id}`)
        setPersonal(res2.data.data || [])
      }
    } catch {
      setPersonal([])
    } finally {
      setCargando(false)
    }
  }

  const filtrados = personal.filter(p =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(buscar.toLowerCase()) ||
    p.cedula?.includes(buscar)
  )

  const presentes = personal.filter(p => p.hora_ingreso).length
  const ausentes  = personal.filter(p => !p.hora_ingreso).length

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-4">Gestión de personal</h2>

      {jornada && (
        <div className="bg-[#1a3a5c] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 font-medium mb-1">OBRA ACTIVA</p>
            <p className="text-white font-bold">{jornada.obra_nombre} — {jornada.obra_ciudad}</p>
            <p className="text-blue-200 text-xs mt-1">
              Jornada iniciada hoy {new Date(jornada.hora_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Responsable: {jornada.inspector_nombre}
            </p>
          </div>
          <div className="flex gap-6 text-center text-white">
            <div><p className="text-3xl font-bold">{presentes}</p><p className="text-xs text-blue-200">Presentes</p></div>
            <div><p className="text-3xl font-bold">{ausentes}</p><p className="text-xs text-blue-200">Ausentes</p></div>
            <div><p className="text-3xl font-bold">{personal.length}</p><p className="text-xs text-blue-200">Asignados</p></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="input-field pl-8" placeholder="Buscar" value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Solo lectura — no puede agregar/eliminar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Documento</th>
                <th className="table-header">Cargo</th>
                <th className="table-header">Hora Ingreso</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-gray-400">Sin personal en obra</td></tr>
              ) : filtrados.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell">{p.id}</td>
                  <td className="table-cell">{p.nombre} {p.apellido}</td>
                  <td className="table-cell">{p.cedula}</td>
                  <td className="table-cell">{p.subcargo_nombre || 'Operario'}</td>
                  <td className="table-cell">
                    {p.hora_ingreso ? new Date(p.hora_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="table-cell">
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