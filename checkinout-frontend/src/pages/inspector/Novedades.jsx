import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const TABS = ['Pendientes', 'Aprobadas', 'Rechazadas', 'Todas']

const novedadesDemo = [
  { id: 1, trabajador: 'Pepito Andres Perez Roa', tipo: 'Permiso médico', fecha: '11/04/2026', estado: 'Pendiente' },
  { id: 2, trabajador: 'Jose Steven Peña Hernan...', tipo: 'Accidente laboral', fecha: '05/04/2026', estado: 'Pendiente' },
  { id: 3, trabajador: 'Javier Esteban Rendón R...', tipo: 'Permiso familiar', fecha: '20/04/2026', estado: 'Pendiente' },
]

const estadoBadge = {
  Pendiente: 'badge-pendiente',
  Aprobada:  'badge-activo',
  Rechazada: 'badge-inactivo',
}

export default function InspectorNovedades() {
  const [tab, setTab] = useState('Pendientes')
  const [formNovedad, setFormNovedad] = useState({
    trabajador: '', tipo: '', fecha: '', descripcion: '', soporte: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  const filtradas = novedadesDemo.filter(n => {
    if (tab === 'Todas') return true
    if (tab === 'Pendientes') return n.estado === 'Pendiente'
    if (tab === 'Aprobadas') return n.estado === 'Aprobada'
    if (tab === 'Rechazadas') return n.estado === 'Rechazada'
    return true
  })

  async function guardarNovedad() {
    setGuardando(true)
    try {
      await api.post('/novedades', formNovedad)
      setExito(true)
      setFormNovedad({ trabajador: '', tipo: '', fecha: '', descripcion: '', soporte: '' })
      setTimeout(() => setExito(false), 3000)
    } catch {
      // demo: solo simular
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-2">Gestión de novedades</h2>

      {/* Alerta pendientes */}
      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-lg mb-4">
        3 Novedades pendientes de revisión por el administrador
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-[#2d5fa6] text-[#2d5fa6] font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Trabajador</th>
                <th className="table-header">Tipo Novedad</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Editar</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-6 text-gray-400">Sin novedades</td></tr>
              ) : filtradas.map(n => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="table-cell">{n.id}</td>
                  <td className="table-cell">{n.trabajador}</td>
                  <td className="table-cell">{n.tipo}</td>
                  <td className="table-cell">{n.fecha}</td>
                  <td className="table-cell"><span className={estadoBadge[n.estado]}>{n.estado}</span></td>
                  <td className="table-cell"><button className="text-gray-400 hover:text-[#2d5fa6]">✏️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulario registrar novedad */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Registrar novedad</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trabajador</label>
            <input className="input-field" placeholder="Nombre o cédula"
              value={formNovedad.trabajador} onChange={e => setFormNovedad({ ...formNovedad, trabajador: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de Novedad</label>
            <select className="input-field" value={formNovedad.tipo} onChange={e => setFormNovedad({ ...formNovedad, tipo: e.target.value })}>
              <option value="">Seleccionar</option>
              <option>Permiso médico</option>
              <option>Accidente laboral</option>
              <option>Permiso familiar</option>
              <option>Calamidad</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha</label>
            <input type="date" className="input-field"
              value={formNovedad.fecha} onChange={e => setFormNovedad({ ...formNovedad, fecha: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Adjuntar soporte</label>
            <input type="file" className="input-field text-xs" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Descripción</label>
            <textarea className="input-field h-16 resize-none"
              value={formNovedad.descripcion} onChange={e => setFormNovedad({ ...formNovedad, descripcion: e.target.value })} />
          </div>
        </div>
        {exito && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded mt-3">Novedad guardada correctamente</p>}
        <div className="flex gap-3 justify-end mt-4">
          <button className="btn-secondary" onClick={() => setFormNovedad({ trabajador: '', tipo: '', fecha: '', descripcion: '', soporte: '' })}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={guardarNovedad} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Novedad'}
          </button>
        </div>
      </div>
    </Layout>
  )
}