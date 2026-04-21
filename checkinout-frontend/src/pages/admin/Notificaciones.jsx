import Layout from '../../components/Layout'

export default function AdminNotificaciones() {
  const novedades = [
    { nombre: 'Juan Perez', cargo: 'Operario - H. Peñalisa', tipo: 'Novedad', subtipo: 'Permiso medico', fecha: '25/04/2026', dias: '1 dia', estado: 'Pendiente' },
    { nombre: 'Jose Manuel Peña', cargo: 'Operario - H. Peñalisa', tipo: 'Traspaso', origen: 'H. Peñalisa', destino: 'H. Nakare', fecha: '25/04/2026', estado: 'Pendiente' },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Gestión de novedades</h2>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {['Pendientes','Novedades','Traspasos','Todas'].map(t => (
          <button key={t} className="pb-2 text-sm text-gray-500 hover:text-[#2d5fa6] first:text-[#2d5fa6] first:border-b-2 first:border-[#2d5fa6] first:font-medium">{t}</button>
        ))}
      </div>

      <div className="space-y-4">
        {novedades.map((n, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{n.nombre}</p>
                <p className="text-xs text-gray-500">{n.cargo}</p>
              </div>
              <div className="flex gap-2">
                <span className="badge-pendiente">{n.estado}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.tipo === 'Novedad' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{n.tipo}</span>
              </div>
            </div>
            {n.subtipo && (
              <div className="flex gap-4 text-xs text-gray-500 mb-2">
                <span>Tipo: <b>{n.subtipo}</b></span>
                <span>Fecha: <b>{n.fecha}</b></span>
                <span>Días: <b>{n.dias}</b></span>
              </div>
            )}
            {n.origen && (
              <div className="flex gap-4 text-xs text-gray-500 mb-2">
                <span>Fecha: <b>{n.fecha}</b></span>
                <span>Origen: <b>{n.origen}</b></span>
                <span>Destino: <b>{n.destino}</b></span>
              </div>
            )}
            <input className="input-field text-xs mb-3" placeholder="Motivo de rechazo (opcional)" />
            <div className="flex gap-2">
              <button className="btn-danger text-xs px-4 py-1.5">Rechazar</button>
              <button className="btn-success text-xs px-4 py-1.5">Aprobar</button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}