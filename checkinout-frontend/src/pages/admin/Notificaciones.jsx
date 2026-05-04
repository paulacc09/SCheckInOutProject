import { useState } from "react";
import TopBar from "../../components/TopBar";

const ITEMS = [
  { nombre: "Juan Perez", tipo: "Novedad", fecha: "25/04/2026", origen: "H. Peñalisa", destino: "H. Peñalisa", pdf: "Orden_medica_perez.juan", meta: "1 día" },
  { nombre: "Jose Manuel Peña", tipo: "Traspaso", fecha: "25/04/2026", origen: "H. Peñalisa", destino: "H. Nakare", pdf: "", meta: "" },
  { nombre: "Juan Perez", tipo: "Novedad", fecha: "25/06/2026", origen: "H. Peñalisa", destino: "H. Peñalisa", pdf: "Orden_medica_perez.juan", meta: "1 día" },
];

export default function Notificaciones() {
  const [page, setPage] = useState(1);
  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Gestión de novedades</h2><select className="select w-40"><option>Tipo</option></select></div>
        <div className="flex gap-4 border-b pb-2 text-sm">
          <button className="text-blue-700 border-b-2 border-blue-600">Pendientes</button><button>Novedades</button><button>Traspasos</button><button>Todos</button>
        </div>
        {ITEMS.map((n, idx) => (
          <div key={idx} className="card card-body space-y-2">
            <div className="font-semibold text-slate-800">{n.nombre}</div>
            <div className="text-sm text-slate-500">Operario - H. Peñalisa</div>
            <div className="text-sm text-slate-500">Regulado por Diana Fernández (Inspector SST)</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`badge ${n.tipo === "Novedad" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{n.tipo}</span>
              <span>Fecha: {n.fecha}</span><span>Origen: {n.origen}</span><span>Destino: {n.destino}</span>
            </div>
            {n.pdf && <div className="text-sm text-red-600">PDF: {n.pdf}</div>}
            <textarea className="textarea" placeholder="Motivo de rechazo (opcional)" />
            <div className="flex gap-2">
              <button className="btn border border-red-500 text-red-600 bg-white">Rechazar</button>
              <button className="btn text-white bg-emerald-600">Aprobar</button>
            </div>
          </div>
        ))}
        <div className="flex justify-center text-sm text-slate-600 gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))}>« Previous</button>
          <span>{page}</span><span>2</span><span>3</span><span>...</span><span>67</span><span>68</span>
          <button onClick={() => setPage((p) => p + 1)}>Next »</button>
        </div>
      </div>
    </>
  );
}
