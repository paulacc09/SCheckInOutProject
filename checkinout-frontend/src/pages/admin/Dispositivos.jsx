import { useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";

const DEVICES = [
  { id: "D1", nombre: "Portátil Mandarino", tipo: "Portátil", obra: "Mandarino", ultimo: "17/02/2025 19:30", estado: "Inactivo" },
  { id: "D2", nombre: "Portátil H.Peñalisa", tipo: "Portátil", obra: "H. Peñalisa", ultimo: "Ayer 19:24", estado: "Activo" },
  { id: "D3", nombre: "Tablet H. Nakare", tipo: "Tablet", obra: "H. Nakare", ultimo: "Hoy 6:10", estado: "Activo" },
];

export default function Dispositivos() {
  const [q, setQ] = useState("");
  const [obra, setObra] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tipo, setTipo] = useState("Tablet");

  const filtered = useMemo(() => DEVICES.filter((d) => {
    const t = q.trim().toLowerCase();
    const okQ = !t || `${d.nombre} ${d.id}`.toLowerCase().includes(t);
    const okObra = !obra || d.obra === obra;
    const okEstado = !estado || d.estado === estado;
    return okQ && okObra && okEstado;
  }), [q, obra, estado]);

  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const data = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <TopBar right={<button className="btn text-white" style={{ background: "#1565C0" }} onClick={() => { setEditing(false); setOpen(true); }}><Plus className="w-4 h-4" /> Registrar Dispositivo</button>} />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Dispositivos</h2>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border p-4"><div className="text-3xl font-bold">3</div><div className="text-sm text-slate-500">Total Registrados</div></div>
          <div className="rounded-xl bg-white border p-4"><div className="text-3xl font-bold">2</div><div className="text-sm text-slate-500">Activos</div></div>
          <div className="rounded-xl bg-white border p-4"><div className="text-3xl font-bold">1</div><div className="text-sm text-slate-500">Inactivos</div></div>
          <div className="rounded-xl bg-white border p-4"><div className="text-3xl font-bold">0</div><div className="text-sm text-slate-500">Sin Asignar</div></div>
        </div>

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-9" placeholder="Buscar" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} /></div>
          <select className="select" value={obra} onChange={(e) => { setPage(1); setObra(e.target.value); }}><option value="">Obra</option><option>Mandarino</option><option>H. Peñalisa</option><option>H. Nakare</option></select>
          <select className="select" value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }}><option value="">Estado</option><option>Activo</option><option>Inactivo</option></select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Obra</th><th>Último Acceso</th><th>Estado</th><th>Editar</th></tr></thead>
            <tbody>
              {data.map((d, idx) => (
                <tr key={d.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                  <td>{d.id}</td><td>{d.nombre}</td><td>{d.tipo}</td><td>{d.obra}</td><td>{d.ultimo}</td>
                  <td><span className={`badge ${d.estado === "Activo" ? "bg-[#4CAF50] text-white" : "bg-[#F44336] text-white"}`}>{d.estado}</span></td>
                  <td><button onClick={() => { setEditing(true); setOpen(true); }}><Pencil className="w-4 h-4 text-slate-500" /></button></td>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar Dispositivo" : "Registrar Dispositivo"} size="lg" footer={null}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Agregar un nuevo dispositivo de marcaje</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["Tablet", "PC/Web", "Biométrico", "Otro"].map((t) => (
              <button key={t} className={`btn ${tipo === t ? "btn-primary" : "btn-outline"}`} onClick={() => setTipo(t)}>{t}</button>
            ))}
          </div>
          <div><label className="label">Nombre / Descripción</label><input className="input" placeholder="El Tablet entrada obra" /></div>
          <div><label className="label">ID dispositivo</label><input className="input" placeholder="DEV-XXX (auto)" /></div>
          <div><label className="label">Obra asignada</label><select className="select"><option>Seleccionar</option><option>Mandarino</option><option>H. Peñalisa</option></select></div>
          <div><label className="label">Código de acceso</label><input className="input" placeholder="PIN 4 a 6 dígitos" /></div>
          <div className="flex justify-end gap-2">
            {editing && <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancelar</button>}
            <button className="btn text-white" style={{ background: "#1565C0" }}>{editing ? "Registrar" : "Registrar"}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
