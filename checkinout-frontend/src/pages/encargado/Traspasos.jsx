import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const historialDemo = [
  { nombre: 'Jorge Peña', ruta: 'Mandarino → H. Nakare', estado: 'Pendiente', fecha: '20-25 abr' },
  { nombre: 'Luis Vargas', ruta: 'H. Peñalisa → H. Nakare', estado: 'Aprobado', fecha: '30 abr' },
  { nombre: 'Luis Vargas', ruta: 'Mandarino → H. Nakare', estado: 'Rechazado', motivo: 'documentación incompleta', fecha: '' },
]

const estadoBadge = {
  Pendiente: 'badge-pendiente',
  Aprobado:  'badge-activo',
  Rechazado: 'badge-inactivo',
}

export default function EncargadoTraspasos() {
  const [form, setForm] = useState({
    origen: '', destino: '', trabajador: '', fecha_inicio: '', fecha_fin: '', motivo: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  async function solicitar() {
    setGuardando(true)
    try {
      await api.post('/traspasos', form)
    } catch { /* demo */ } finally {
      setExito(true)
      setForm({ origen: '', destino: '', trabajador: '', fecha_inicio: '', fecha_fin: '', motivo: '' })
      setTimeout(() => setExito(false), 3000)
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Traspaso de trabajadores</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          Requiere autorización de administrador
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-lg mb-6">
        Los traspasos solicitados quedan pendientes de aprobación por el administrador
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Formulario solicitar */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Solicitar traspaso</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Origen</label>
                <select className="input-field" value={form.origen} onChange={e => setForm({...form, origen: e.target.value})}>
                  <option value="">Seleccionar obra</option>
                  <option>Mandarino</option>
                  <option>H. Peñalisa</option>
                  <option>H. Nakare</option>
                </select>
              </div>
              <span className="text-gray-400 pb-2">→</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Destino</label>
                <select className="input-field" value={form.destino} onChange={e => setForm({...form, destino: e.target.value})}>
                  <option value="">Seleccionar obra</option>
                  <option>Mandarino</option>
                  <option>H. Peñalisa</option>
                  <option>H. Nakare</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Trabajador a traspasar</label>
              <input className="input-field" placeholder="Buscar por nombre o cédula"
                value={form.trabajador} onChange={e => setForm({...form, trabajador: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                <input type="date" className="input-field" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha fin (opcional)</label>
                <input type="date" className="input-field" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo</label>
              <textarea className="input-field h-16 resize-none" placeholder="Motivo del traspaso..."
                value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} />
            </div>

            {exito && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded">Solicitud enviada correctamente</p>}

            <div className="flex justify-end">
              <button className="btn-primary" onClick={solicitar} disabled={guardando}>
                {guardando ? 'Enviando...' : 'Solicitar traspaso'}
              </button>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Historial de traspasos</h3>
            <select className="input-field text-xs w-32">
              <option>Estado</option>
              <option>Pendiente</option>
              <option>Aprobado</option>
              <option>Rechazado</option>
            </select>
          </div>
          <div className="space-y-3">
            {historialDemo.map((h, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{h.nombre}</p>
                  <span className={estadoBadge[h.estado]}>{h.estado}</span>
                </div>
                <p className="text-xs text-gray-500">{h.ruta}</p>
                {h.fecha && <p className="text-xs text-gray-400">Solicitado {h.fecha}</p>}
                {h.motivo && <p className="text-xs text-red-400 mt-1">Motivo: {h.motivo}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}