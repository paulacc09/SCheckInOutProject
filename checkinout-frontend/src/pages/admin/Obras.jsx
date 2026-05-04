import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import TopBar from "../../components/TopBar";

const OBRAS = [
  { id: 1, codigo: "OB-001", nombre: "Mandarino", ciudad: "Bogotá", estado: "activa" },
  { id: 2, codigo: "OB-002", nombre: "H. Peñalisa", ciudad: "Ibagué", estado: "suspendida" },
  { id: 3, codigo: "OB-003", nombre: "H. Nakare", ciudad: "Bogotá", estado: "activa" },
  { id: 4, codigo: "OB-004", nombre: "Proyecto Norte", ciudad: "Tunja", estado: "finalizada" },
];

export default function Obras() {
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return OBRAS.filter((o) => {
      const okQ = !t || `${o.codigo} ${o.nombre} ${o.ciudad}`.toLowerCase().includes(t);
      const okEstado = !filtroEstado || o.estado === filtroEstado;
      return okQ && okEstado;
    });
  }, [q, filtroEstado]);

  const stats = useMemo(() => {
    const total = filtradas.length;
    const activos = filtradas.filter((o) => o.estado === "activa").length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [filtradas]);

  return (
    <>
      <TopBar right={<button className="btn text-white" style={{ background: "#1565C0" }}><Plus className="w-4 h-4" /> Crear Obra</button>} />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Mis Obras</h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">{stats.total}</div><div className="text-sm text-slate-500">Total Registrados</div></div>
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">{stats.activos}</div><div className="text-sm text-slate-500">Activos</div></div>
          <div className="rounded-xl bg-white border p-5"><div className="text-3xl font-bold">{stats.inactivos}</div><div className="text-sm text-slate-500">Inactivos</div></div>
        </div>

        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Buscar por código, nombre o ciudad…" />
          </div>
          <select className="select sm:w-44" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option><option value="activa">Activa</option><option value="suspendida">Suspendida</option><option value="finalizada">Finalizada</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Ciudad</th><th>Estado</th></tr></thead>
            <tbody>
              {filtradas.map((o, idx) => (
                <tr key={o.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                  <td>{o.codigo}</td><td className="font-medium">{o.nombre}</td><td>{o.ciudad}</td>
                  <td><span className={`badge ${o.estado === "activa" ? "bg-[#4CAF50] text-white" : "bg-[#F44336] text-white"}`}>{o.estado === "activa" ? "Activo" : "Inactivo"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
