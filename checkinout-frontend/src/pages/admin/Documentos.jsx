import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import TopBar from "../../components/TopBar";

const DOCS = [
  { id: 1, trabajador: "Pepito Andres Perez Roa", documento: "Examen médico", emision: "30/06/2025", vencimiento: "30/08/2026", estado: "Vigente" },
  { id: 2, trabajador: "Jose Steven Peña Hernan", documento: "Curso de alturas", emision: "27/10/2024", vencimiento: "27/04/2026", estado: "Por vencer" },
  { id: 3, trabajador: "Javier Esteban Rendón", documento: "Examen médico", emision: "10/04/2025", vencimiento: "10/04/2025", estado: "Vencido" },
];

export default function Documentos() {
  const [tab, setTab] = useState("Todos");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => DOCS.filter((d) => {
    const t = q.trim().toLowerCase();
    const okQ = !t || `${d.trabajador} ${d.documento}`.toLowerCase().includes(t);
    const okTab = tab === "Todos" || d.estado === tab;
    const okEstado = !estado || d.estado === estado;
    const okTipo = !tipo || d.documento === tipo;
    return okQ && okTab && okEstado && okTipo;
  }), [q, tab, estado, tipo]);

  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de documentos del personal</h2>
        <div className="flex gap-4 border-b">
          {["Todos", "Vigente", "Por vencer", "Vencido"].map((t) => (
            <button key={t} className={`pb-2 ${tab === t || (tab === "Todos" && t === "Todos") ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500"}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="rounded-lg border border-yellow-300 bg-yellow-100 text-yellow-900 px-4 py-2">3 Documentos próximos a vencer - revisar antes del 28 de Abril</div>

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-9" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Estado</option><option>Vigente</option><option>Por vencer</option><option>Vencido</option></select>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Documento</option><option>Examen médico</option><option>Curso de alturas</option></select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Trabajador</th><th>Documento</th><th>Emisión</th><th>Vencimiento</th><th>Estado</th><th>Editar</th></tr></thead>
            <tbody>
              {filtered.map((d, idx) => (
                <tr key={d.id + d.trabajador} className={idx % 2 ? "bg-slate-50/50" : ""}>
                  <td>{d.id}</td><td>{d.trabajador}</td><td>{d.documento}</td><td>{d.emision}</td><td>{d.vencimiento}</td>
                  <td><span className={`badge ${d.estado === "Vigente" ? "bg-[#4CAF50] text-white" : d.estado === "Por vencer" ? "bg-orange-400 text-white" : "bg-[#F44336] text-white"}`}>{d.estado}</span></td>
                  <td><Pencil className="w-4 h-4 text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center text-sm text-slate-600 gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))}>« Previous</button>
          <span>{page}</span><span>2</span><span>3</span><span>...</span><span>67</span><span>68</span>
          <button onClick={() => setPage((p) => p + 1)}>Next »</button>
        </div>
      </div>
    </>
  );
}
