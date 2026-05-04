import { useMemo, useState } from "react";
import { Plus, Search, Pencil } from "lucide-react";
import TopBar from "../../components/TopBar";

const MOCK = [
  { id: 1, nombre: "Pepito Andrés Perez Roa", cedula: "1023456789", cargo: "Operario", obra: "Mandarino", estado: "activo" },
  { id: 2, nombre: "José Steven Peña", cedula: "1023678901", cargo: "Oficial", obra: "H. Peñalisa", estado: "inactivo" },
  { id: 3, nombre: "Javier Esteban Rendón", cedula: "1023000000", cargo: "Operario", obra: "H. Nakare", estado: "activo" },
  { id: 4, nombre: "Manuel Gámez", cedula: "1099999999", cargo: "Maestro", obra: "Mandarino", estado: "activo" },
];

export default function Personal() {
  const PAGE_SIZE = 3;
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [obraFiltro, setObraFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [cargo, setCargo] = useState("");

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MOCK.filter((w) => {
      const okQ = !t || `${w.nombre} ${w.cedula}`.toLowerCase().includes(t);
      const okEstado = !estado || w.estado === estado;
      const okObra = !obraFiltro || w.obra === obraFiltro;
      const okCargo = !cargo || w.cargo === cargo;
      return okQ && okEstado && okObra && okCargo;
    });
  }, [q, estado, obraFiltro, cargo]);

  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <>
      <TopBar right={<button className="btn text-white" style={{ background: "#1565C0" }}><Plus className="w-4 h-4" /> Registrar Trabajador</button>} />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Personal</h2>
        <div className="card card-body flex flex-col lg:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="input pl-9" placeholder="Buscar por nombre o cédula…" />
          </div>
          <select className="select sm:w-40" value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <select className="select sm:w-44" value={cargo} onChange={(e) => { setPage(1); setCargo(e.target.value); }}>
            <option value="">Todos los cargos</option><option>Operario</option><option>Oficial</option><option>Maestro</option>
          </select>
          <select className="select sm:w-44" value={obraFiltro} onChange={(e) => { setPage(1); setObraFiltro(e.target.value); }}>
            <option value="">Todas las obras</option><option>Mandarino</option><option>H. Peñalisa</option><option>H. Nakare</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Obra</th><th>Estado</th><th>Editar</th></tr></thead>
            <tbody>
              {rows.map((t, idx) => (
                <tr key={t.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                  <td>{t.id}</td><td className="font-medium">{t.nombre}</td><td>{t.cedula}</td><td>{t.cargo}</td><td>{t.obra}</td>
                  <td><span className={`badge ${t.estado === "activo" ? "bg-[#4CAF50] text-white" : "bg-[#F44336] text-white"}`}>{t.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
                  <td><Pencil className="w-4 h-4 text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex justify-center text-sm text-slate-600 gap-3">
            <button disabled={page <= 1} onClick={goPrev}>« Previous</button>
            <span>{page}</span><span>2</span><span>3</span><span>...</span><span>67</span><span>68</span>
            <button disabled={page >= totalPages} onClick={goNext}>Next »</button>
          </div>
        )}
      </div>
    </>
  );
}
