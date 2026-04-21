import { useState } from 'react'
import Layout from '../../components/Layout'

const TABS = ['Todos', 'Vigentes', 'Por Vencer', 'Vencidos']

const docs = [
  { id: 1, trabajador: 'Pepito Andres Perez Roa', documento: 'Examen medico', emision: '30/06/2025', vencimiento: '30/06/2026', estado: 'Vigente' },
  { id: 2, trabajador: 'Jose Steven Peña Hernan...', documento: 'Curso de alturas', emision: '27/10/2024', vencimiento: '27/04/2026', estado: 'Por vencer' },
  { id: 3, trabajador: 'Javier Esteban Rendón R...', documento: 'Examen medico', emision: '10/04/2025', vencimiento: '10/04/2025', estado: 'Vencido' },
]

const estadoStyle = {
  'Vigente': 'badge-vigente',
  'Por vencer': 'badge-por-vencer',
  'Vencido': 'badge-vencido',
}

export default function AdminDocumentos() {
  const [tab, setTab] = useState('Todos')

  const filtrados = tab === 'Todos' ? docs
    : tab === 'Vigentes' ? docs.filter(d => d.estado === 'Vigente')
    : tab === 'Por Vencer' ? docs.filter(d => d.estado === 'Por vencer')
    : docs.filter(d => d.estado === 'Vencido')

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-4">Gestión de documentos del personal</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm transition-colors ${tab===t ? 'border-b-2 border-[#2d5fa6] text-[#2d5fa6] font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {/* Alerta */}
      {(tab === 'Todos' || tab === 'Por Vencer') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-lg mb-4">
          3 Documentos próximos a vencer — revisar antes del 28 de Abril
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">ID</th>
                <th className="table-header">Trabajador</th>
                <th className="table-header">Documento</th>
                <th className="table-header">Emisión</th>
                <th className="table-header">Vencimiento</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Editar</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="table-cell">{d.id}</td>
                  <td className="table-cell">{d.trabajador}</td>
                  <td className="table-cell text-[#2d5fa6]">{d.documento}</td>
                  <td className="table-cell text-[#2d5fa6]">{d.emision}</td>
                  <td className="table-cell text-[#2d5fa6]">{d.vencimiento}</td>
                  <td className="table-cell"><span className={estadoStyle[d.estado]}>{d.estado}</span></td>
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