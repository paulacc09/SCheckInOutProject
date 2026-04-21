import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const estadoBadge = {
  salida: 'bg-blue-100 text-blue-700',
  presente: 'bg-green-100 text-green-700',
  ausente: 'bg-red-100 text-red-700',
}

export default function AdminAsistencias() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setCargando(true)
      const res = await api.get('/asistencia/listar')
      setRegistros(res.data.data || [])
    } catch {
      setRegistros([])
    } finally {
      setCargando(false)
    }
  }

  const filtrados = registros.filter(r =>
    r.trabajador_nombre?.toLowerCase().includes(buscar.toLowerCase())
  )

  const total = registros.length
  const activos = registros.filter(r => !r.hora_cierre).length
  const inactivos = total - activos

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Gestión Asistencias</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Registrados</p>
        </div>
        <div className="card p-4">
          <p className="text-3xl font-bold">{activos}</p>
          <p className="text-xs text-gray-500 mt-1">Activos</p>
        </div>
        <div className="card p-4">
          <p className="text-3xl font-bold">{inactivos}</p>
          <p className="text-xs text-gray-500 mt-1">Inactivos</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="input-field pl-8" placeholder="Buscar" value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Obra</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Ingreso</th>
                <th className="table-header">Salida</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="table-cell text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-8 text-gray-400">Sin registros</td></tr>
              ) : filtrados.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell text-[#2d5fa6]">{r.trabajador_id}</td>
                  <td className="table-cell">{r.trabajador_nombre || r.trabajador}</td>
                  <td className="table-cell">{r.obra_nombre || '—'}</td>
                  <td className="table-cell">{r.fecha}</td>
                  <td className="table-cell text-[#2d5fa6]">{r.hora_ingreso ? new Date(r.hora_ingreso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                  <td className="table-cell text-[#2d5fa6]">{r.hora_salida ? new Date(r.hora_salida).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.hora_salida ? estadoBadge.salida : r.hora_ingreso ? estadoBadge.presente : estadoBadge.ausente
                    }`}>
                      {r.hora_salida ? 'Salida' : r.hora_ingreso ? 'Presente' : 'Ausente'}
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