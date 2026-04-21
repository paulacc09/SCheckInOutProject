import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function InspectorReportes() {
  const [reporte, setReporte] = useState([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cargando, setCargando] = useState(false)

  async function generar() {
    setCargando(true)
    try {
      const res = await api.get('/reportes/asistencia', {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      })
      setReporte(res.data.data || [])
    } catch {
      setReporte([])
    } finally {
      setCargando(false)
    }
  }

  const totalRegistros = 1000
  const diasAsistencia = 20
  const ausenciasTotal = 15
  const promedioDiario = 57

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Gestión Reportes — Hacienda Nakare</h2>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">Exportar CSV</button>
          <button className="btn-primary text-sm">Exportar PDF</button>
        </div>
      </div>

      {/* Filtro + stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 card p-4 flex flex-col gap-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Fecha Inicio</label>
              <input type="date" className="input-field text-xs" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Fecha Fin</label>
              <input type="date" className="input-field text-xs" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary text-sm" onClick={generar}>Generar</button>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 underline">Resumen del periodo</p>
            <div className="space-y-1 text-xs">
              {[['Total registros', totalRegistros],['Días con asistencia','20 días'],['Ausencias totales',15],['Promedio diario',57]].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500 underline">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-4 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-gray-800">55</p>
          <p className="text-xs text-gray-500 text-center mt-1">Asistencia hoy de 61 asignados</p>
        </div>
        <div className="card p-4 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-gray-800">95%</p>
          <p className="text-xs text-gray-500 text-center mt-1">Asistencia Promedio semana</p>
        </div>
        <div className="space-y-4">
          <div className="card p-4 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-800">5</p>
            <p className="text-xs text-gray-500 text-center mt-1">Novedades mes — 2 Justificadas</p>
          </div>
          <div className="card p-4 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-800">10</p>
            <p className="text-xs text-gray-500 text-center mt-1">Ausencias mes</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Días asistidos</th>
                <th className="table-header">Ausencias</th>
                <th className="table-header">Horas totales</th>
                <th className="table-header">Editar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-gray-400">Generando...</td></tr>
              ) : reporte.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-gray-400">Selecciona fechas y presiona Generar</td></tr>
              ) : reporte.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell text-[#2d5fa6]">{r.trabajador_id}</td>
                  <td className="table-cell">{r.trabajador}</td>
                  <td className="table-cell text-[#2d5fa6]">{r.dias_asistidos ?? '—'}</td>
                  <td className="table-cell text-[#2d5fa6]">{r.ausencias ?? '—'}</td>
                  <td className="table-cell text-[#2d5fa6]">{r.horas_trabajadas ? Math.round(r.horas_trabajadas) : '—'}</td>
                  <td className="table-cell"><button className="text-gray-400 hover:text-[#2d5fa6]">✏️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}