import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import api from '../../api/axios'

const estadoColor = {
  activa: 'badge-activo',
  finalizada: 'badge-concluida',
  suspendida: 'badge-inactivo',
}

export default function AdminObras() {
  const [obras, setObras] = useState([])
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [form, setForm] = useState({
    codigo: '', nombre: '', ciudad: '', direccion: '',
    estado: 'activa', responsable_sst_id: '', id_dispositivo: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarObras() }, [])

  async function cargarObras() {
    try {
      setCargando(true)
      const res = await api.get('/obras')
      setObras(res.data.data || [])
    } catch {
      setObras([])
    } finally {
      setCargando(false)
    }
  }

  async function crearObra() {
    setError('')
    setGuardando(true)
    try {
      await api.post('/obras', form)
      setModalCrear(false)
      setForm({ codigo: '', nombre: '', ciudad: '', direccion: '', estado: 'activa', responsable_sst_id: '', id_dispositivo: '' })
      cargarObras()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al crear obra')
    } finally {
      setGuardando(false)
    }
  }

  const obrasFiltradas = obras.filter(o =>
    o.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    o.codigo?.toLowerCase().includes(buscar.toLowerCase())
  )

  // Stats
  const total = obras.length
  const activas = obras.filter(o => o.estado === 'activa').length
  const trabajadoresActivos = 179
  const asistenciaPromedio = 97
  const sinJustificar = 5
  const pendientes = 3

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Mis Obras</h2>
        <button
          onClick={() => setModalCrear(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Crear Obra
        </button>
      </div>

      {/* Tabla */}
      <div className="card mb-6">
        <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="input-field pl-8"
              placeholder="Buscar"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID Obra</th>
                <th className="table-header">Nombre Obra</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Personal Asignado</th>
                <th className="table-header">Personal Presente</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">Cargando...</td></tr>
              ) : obrasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">No hay obras registradas</td></tr>
              ) : obrasFiltradas.map(obra => (
                <tr key={obra.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="table-cell font-medium text-[#2d5fa6]">{obra.codigo}</td>
                  <td className="table-cell text-[#2d5fa6] underline">{obra.nombre}</td>
                  <td className="table-cell">{obra.ciudad || '—'}</td>
                  <td className="table-cell">
                    <span className={estadoColor[obra.estado] || 'badge-pendiente'}>
                      {obra.estado === 'activa' ? 'Activa' : obra.estado === 'finalizada' ? 'Concluida' : 'Suspendida'}
                    </span>
                  </td>
                  <td className="table-cell text-[#2d5fa6]">—</td>
                  <td className="table-cell text-[#2d5fa6]">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-3xl font-bold text-gray-800">{trabajadoresActivos}</p>
          <p className="text-xs text-gray-500 mt-1">Trabajadores Activos</p>
        </div>
        <div className="card p-4">
          <p className="text-3xl font-bold text-gray-800">{asistenciaPromedio}%</p>
          <p className="text-xs text-gray-500 mt-1">Asistencia Promedio Hoy</p>
        </div>
        <div className="card p-4">
          <p className="text-3xl font-bold text-gray-800">{sinJustificar}</p>
          <p className="text-xs text-gray-500 mt-1">Asistencias sin Justificar</p>
        </div>
        <div className="card p-4">
          <p className="text-3xl font-bold text-gray-800">{pendientes}</p>
          <p className="text-xs text-gray-500 mt-1">Pendientes</p>
        </div>
      </div>

      {/* Modal Crear Obra */}
      {modalCrear && (
        <Modal
          titulo="Crear nueva obra"
          subtitulo="Completa los datos del proyecto de construcción"
          onClose={() => setModalCrear(false)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código de obra</label>
              <input className="input-field" placeholder="Ej. 26IBG02"
                value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la obra</label>
              <input className="input-field" placeholder="Nombre del proyecto"
                value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección / Ubicación</label>
              <input className="input-field" placeholder="Dirección completa"
                value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
              <input className="input-field" placeholder="Seleccionar"
                value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado inicial</label>
              <select className="input-field" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                <option value="activa">Activa</option>
                <option value="suspendida">Suspendida</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Dispositivo principal (Opcional)</label>
              <input className="input-field" placeholder="ID del dispositivo de marcaje"
                value={form.id_dispositivo} onChange={e => setForm({...form, id_dispositivo: e.target.value})} />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <div className="flex gap-3 mt-6 justify-end">
            <button className="btn-secondary" onClick={() => setModalCrear(false)}>Cancelar</button>
            <button className="btn-primary" onClick={crearObra} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear Obra'}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  )
}