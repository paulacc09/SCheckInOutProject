import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import api from '../../api/axios'

export default function AdminPersonal() {
  const [trabajadores, setTrabajadores] = useState([])
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '',
    email: '', subcargo_id: '', estado: 'activo'
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarTrabajadores() }, [])

  async function cargarTrabajadores() {
    try {
      setCargando(true)
      const res = await api.get('/trabajadores')
      setTrabajadores(res.data.data || [])
    } catch {
      setTrabajadores([])
    } finally {
      setCargando(false)
    }
  }

  async function guardarTrabajador() {
    setError('')
    setGuardando(true)
    try {
      if (modalEditar && seleccionado) {
        await api.put(`/trabajadores/${seleccionado.id}`, form)
      } else {
        await api.post('/trabajadores', form)
      }
      setModalCrear(false)
      setModalEditar(false)
      setSeleccionado(null)
      setForm({ nombre: '', apellido: '', cedula: '', telefono: '', email: '', subcargo_id: '', estado: 'activo' })
      cargarTrabajadores()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  function abrirEditar(t) {
    setSeleccionado(t)
    setForm({
      nombre: t.nombre || '', apellido: t.apellido || '',
      cedula: t.cedula || '', telefono: t.telefono || '',
      email: t.email || '', subcargo_id: t.subcargo_id || '',
      estado: t.estado || 'activo'
    })
    setModalEditar(true)
  }

  const filtrados = trabajadores.filter(t =>
    `${t.nombre} ${t.apellido}`.toLowerCase().includes(buscar.toLowerCase()) ||
    t.cedula?.includes(buscar)
  )

  const FormTrabajador = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombres</label>
          <input className="input-field" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombres" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos</label>
          <input className="input-field" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Apellidos" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo documento</label>
          <select className="input-field">
            <option>Cédula</option>
            <option>Pasaporte</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nº documento</label>
          <input className="input-field" value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} placeholder="Número" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
          <input className="input-field" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="Celular" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
          <select className="input-field" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
          <input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="correo@empresa.com" />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="flex gap-3 justify-end mt-2">
        <button className="btn-secondary" onClick={() => { setModalCrear(false); setModalEditar(false) }}>Cancelar</button>
        <button className="btn-primary" onClick={guardarTrabajador} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Gestión Personal</h2>
        <button onClick={() => setModalCrear(true)} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Registrar Trabajador
        </button>
      </div>

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
                <th className="table-header">Documento</th>
                <th className="table-header">Cargo</th>
                <th className="table-header">Obra</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Editar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">No hay trabajadores</td></tr>
              ) : filtrados.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="table-cell text-[#2d5fa6]">{t.id}</td>
                  <td className="table-cell text-[#2d5fa6]">{t.nombre} {t.apellido}</td>
                  <td className="table-cell text-[#2d5fa6]">{t.cedula}</td>
                  <td className="table-cell">{t.subcargo_nombre || '—'}</td>
                  <td className="table-cell">—</td>
                  <td className="table-cell">
                    <span className={t.estado === 'activo' ? 'badge-activo' : 'badge-inactivo'}>
                      {t.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => abrirEditar(t)} className="text-gray-400 hover:text-[#2d5fa6]">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalCrear && (
        <Modal titulo="Registrar nuevo trabajador" subtitulo="Datos personales, asignación y biometría" onClose={() => setModalCrear(false)}>
          <FormTrabajador />
        </Modal>
      )}
      {modalEditar && (
        <Modal titulo="Editar trabajador" subtitulo="Datos personales, asignación y biometría" onClose={() => setModalEditar(false)}>
          <FormTrabajador />
        </Modal>
      )}
    </Layout>
  )
}