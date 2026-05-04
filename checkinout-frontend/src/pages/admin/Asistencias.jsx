import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import TopBar from "../../components/TopBar";

const ROWS = [
  { id: 1, nombre: "Pepito Andres Perez Roa", obra: "Mandarino", fecha: "11/04/2026", ingreso: "6:00", salida: "18:00", estado: "Salida" },
  { id: 2, nombre: "Jose Steven Peña Hernan", obra: "H. Peñalisa", fecha: "11/04/2026", ingreso: "5:30", salida: "17:56", estado: "Salida" },
  { id: 3, nombre: "Javier Esteban Rendón", obra: "H. Nakare", fecha: "11/04/2026", ingreso: "5:45", salida: "--", estado: "Presente" },
  { id: 4, nombre: "Manuel Esteban Gámez", obra: "Mandarino", fecha: "11/04/2026", ingreso: "--", salida: "--", estado: "Ausente" },
  { id: 5, nombre: "Jesus Alberto de Agua", obra: "H. Peñalisa", fecha: "11/06/2026", ingreso: "6:10", salida: "19:00", estado: "Salida" },
];

export default function Asistencias() {
  const [q, setQ] = useState("");
  const [obra, setObra] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 4;

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ROWS.filter((r) => {
      const okQ = !t || r.nombre.toLowerCase().includes(t);
      const okObra = !obra || r.obra === obra;
      const okFecha = !fecha || r.fecha === fecha;
      const okEstado = !estado || r.estado === estado;
      return okQ && okObra && okFecha && okEstado;
    });
  }, [q, obra, fecha, estado]);
  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage));
  const data = filtrados.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Asistencias</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">3</div><div className="text-sm text-slate-500">Total Registrados</div></div>
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">2</div><div className="text-sm text-slate-500">Activos</div></div>
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">1</div><div className="text-sm text-slate-500">Inactivos</div></div>
        </div>
        <div className="card card-body flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-9" placeholder="Buscar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} /></div>
            <select className="select" value={obra} onChange={(e) => { setPage(1); setObra(e.target.value); }}><option value="">Obra</option><option>Mandarino</option><option>H. Peñalisa</option><option>H. Nakare</option></select>
            <select className="select" value={fecha} onChange={(e) => { setPage(1); setFecha(e.target.value); }}><option value="">Fecha</option><option>11/04/2026</option><option>11/06/2026</option></select>
            <select className="select" value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }}><option value="">Estado</option><option>Salida</option><option>Presente</option><option>Ausente</option></select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Obra</th><th>Fecha</th><th>Ingreso</th><th>Salida</th><th>Estado</th></tr></thead>
            <tbody>
              {data.map((r, idx) => (
                <tr key={r.id + r.nombre} className={idx % 2 ? "bg-slate-50/50" : ""}>
                  <td>{r.id}</td><td>{r.nombre}</td><td>{r.obra}</td><td>{r.fecha}</td><td>{r.ingreso}</td><td>{r.salida}</td>
                  <td><span className={`badge ${r.estado === "Presente" ? "bg-[#4CAF50] text-white" : r.estado === "Salida" ? "bg-[#F44336] text-white" : "bg-slate-400 text-white"}`}>{r.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center text-sm text-slate-600 gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>« Previous</button>
          <span>{page}</span><span>2</span><span>3</span><span>...</span><span>67</span><span>68</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next »</button>
        </div>
      </div>
    </>
  );
}
