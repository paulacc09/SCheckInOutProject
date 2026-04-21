import Layout from '../../components/Layout'
import { useState } from 'react'
import Modal from '../../components/Modal'

export default function AdminDispositivos() {
  const [modalCrear, setModalCrear] = useState(false)
  const [tipo, setTipo] = useState('Tablet')

  const dispositivos = [
    { id: 'D1', nombre: 'Portátil Mandarino', tipo: 'Portátil', obra: 'Mandarino', ultimo: '17/02/2025 13:30', estado: 'Inactivo' },
    { id: 'D2', nombre: 'Portátil H.Peñalisa', tipo: 'Portátil', obra: 'H. Peñalisa', ultimo: 'Ayer 19:24', estado: 'Activo' },
    { id: 'D3', nombre: 'Tablet H. Nakare', tipo: 'Tablet', obra: 'H. Nakare', ultimo: 'Hoy 6:30', estado: 'Activo' },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Gestión Dispositivos</h2>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModalCrear(true)}>
          <span>+</span> Registrar Dispositivo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[['3','Total Registrados'],['2','Activos'],['1','Inactivos'],['0','Sin Asignar']].map(([n,l]) => (
          <div key={l} className="card p-4">
            <p className="text-3xl font-bold">{n}</p>
            <p className="text-xs text-gray-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Nombre</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Obra</th>
                <th className="table-header">Último Acceso</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Editar</th>
              </tr>
            </thead>
            <tbody>
              {dispositivos.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="table-cell text-[#2d5fa6]">{d.id}</td>
                  <td className="table-cell">{d.nombre}</td>
                  <td className="table-cell">{d.tipo}</td>
                  <td className="table-cell text-[#2d5fa6]">{d.obra}</td>
                  <td className="table-cell">{d.ultimo}</td>
                  <td className="table-cell">
                    <span className={d.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}>{d.estado}</span>
                  </td>
                  <td className="table-cell">
                    <button className="text-gray-400 hover:text-[#2d5fa6]">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalCrear && (
        <Modal titulo="Registrar Dispositivo" subtitulo="Agregar un nuevo dispositivo de marcaje" onClose={() => setModalCrear(false)}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Tipo de dispositivo</p>
              <div className="flex gap-2">
                {['Tablet','PC/Web','Biométrico','Otro'].map(t => (
                  <button key={t}
                    onClick={() => setTipo(t)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${tipo===t ? 'bg-[#2d5fa6] text-white border-[#2d5fa6]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre / Descripción</label>
                <input className="input-field" placeholder="Ej. Tablet entrada obra" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ID dispositivo</label>
                <input className="input-field" placeholder="DEV-XXX (auto)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Obra asignada</label>
                <select className="input-field"><option>Seleccionar</option></select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código de acceso</label>
                <input className="input-field" placeholder="PIN 4 a 6 dígitos" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button className="btn-secondary" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="btn-primary">Registrar</button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}