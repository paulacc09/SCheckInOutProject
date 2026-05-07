import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Clock3,
  HardDrive,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as obrasService from "../../services/obrasService";

const PAGE_SIZE = 8;

function badgeObra(estado) {
  if (estado === "activa") return "bg-[#dcfce7] text-[#16a34a]";
  if (estado === "suspendida") return "bg-[#fef3c7] text-[#b45309]";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

export default function Obras() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    trabajadoresActivos: 0,
    asistenciaPromedio: 0,
    asistenciasSinJustificar: 0,
    pendientes: 0,
  });
  const [pendientes, setPendientes] = useState([]);
  const [pendTipo, setPendTipo] = useState("Todos");
  const [pendObra, setPendObra] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState({});
  const [form, setForm] = useState({
    id: "",
    nombre: "",
    ubicacion: "",
    estado: "activa",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const [obrasRes, statsRes, pendientesRes] = await Promise.all([
      obrasService.getAll({ search: q, estado }),
      obrasService.getGlobalStats(),
      obrasService.getPendientes({ tipo: pendTipo, obra: pendObra }),
    ]);
    setLoading(false);
    if (!obrasRes.ok) return setFlash({ type: "error", message: obrasRes.message });
    if (!statsRes.ok) return setFlash({ type: "error", message: statsRes.message });
    if (!pendientesRes.ok) return setFlash({ type: "error", message: pendientesRes.message });
    setRows(obrasRes.data);
    setStats(statsRes.data);
    setPendientes(pendientesRes.data);
  }, [q, estado, pendTipo, pendObra]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPage(1);
  }, [q, estado]);

  const obrasOptions = useMemo(() => ["Todas", ...rows.map((o) => o.nombre)], [rows]);
  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const openCreate = async () => {
    setEditingId(null);
    setFormErr({});
    setForm({
      id: obrasService.getNextObraId(),
      nombre: "",
      ubicacion: "",
      estado: "activa",
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setFormErr({});
    setForm({
      id: row.id,
      nombre: row.nombre,
      ubicacion: row.ubicacion,
      estado: row.estado,
    });
    setModalOpen(true);
  };

  const validate = () => {
    const err = {};
    if (!form.nombre.trim()) err.nombre = "El nombre es obligatorio";
    if (!form.ubicacion.trim()) err.ubicacion = "La ubicación es obligatoria";
    setFormErr(err);
    return Object.keys(err).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      id: form.id,
      nombre: form.nombre,
      ubicacion: form.ubicacion,
      estado: form.estado,
    };
    const res = editingId
      ? await obrasService.update(editingId, payload)
      : await obrasService.create(payload);
    setSaving(false);
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setModalOpen(false);
    setFlash({ type: "ok", message: editingId ? "Obra actualizada" : "Obra creada" });
    await cargar();
  };

  const removeRow = async (row) => {
    if (!window.confirm(`¿Eliminar la obra ${row.nombre}? Esta acción no se puede deshacer`)) return;
    const res = await obrasService.remove(row.id);
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setFlash({ type: "ok", message: "Obra eliminada" });
    await cargar();
  };

  const iconByType = (tipo) => {
    if (tipo === "Médico") return <UserRound className="w-4 h-4 text-[#3b82f6]" />;
    if (tipo === "Asistencia") return <ClipboardList className="w-4 h-4 text-[#22c55e]" />;
    return <HardDrive className="w-4 h-4 text-[#f59e0b]" />;
  };

  return (
    <>
      <TopBar
        title="Mis Obras"
        right={
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={openCreate}>
            <Plus className="w-4 h-4" /> Crear Obra
          </button>
        }
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." />
          </div>
          <select className="select sm:w-48" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activa">activa</option>
            <option value="finalizada">finalizada</option>
            <option value="suspendida">suspendida</option>
          </select>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="card card-body"><div className="flex items-center gap-2"><Users className="w-5 h-5 text-[#3b82f6]" /><div className="text-[30px] font-bold">{stats.trabajadoresActivos}</div></div><div className="text-xs text-slate-500">Trabajadores Activos</div></div>
          <div className="card card-body"><div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#22c55e]" /><div className="text-[30px] font-bold">{stats.asistenciaPromedio}%</div></div><div className="text-xs text-slate-500">Asistencia Promedio Hoy</div></div>
          <div className="card card-body"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-[#f59e0b]" /><div className="text-[30px] font-bold">{stats.asistenciasSinJustificar}</div></div><div className="text-xs text-slate-500">Asistencias sin Justificar</div></div>
          <div className="card card-body"><div className="flex items-center gap-2"><Clock3 className="w-5 h-5 text-[#ef4444]" /><div className="text-[30px] font-bold">{stats.pendientes}</div></div><div className="text-xs text-slate-500">Pendientes</div></div>
        </div>

        <div className="card card-body space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Pendientes</h3>
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-semibold">{stats.pendientes}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <select className="select" value={pendTipo} onChange={(e) => setPendTipo(e.target.value)}>
              <option>Todos</option>
              <option>Médico</option>
              <option>Asistencia</option>
              <option>Dispositivo</option>
            </select>
            <select className="select" value={pendObra} onChange={(e) => setPendObra(e.target.value)}>
              {obrasOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {pendientes.length ? (
              pendientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                  <div className="flex items-center gap-2">
                    {iconByType(p.tipo)}
                    <div>
                      <div className="text-sm font-semibold">{p.titulo}</div>
                      <div className="text-xs text-slate-500">{p.trabajador ? `${p.trabajador} — ${p.obra}` : p.obra}</div>
                    </div>
                  </div>
                  <span className={`badge ${p.tipo === "Médico" ? "bg-blue-100 text-blue-700" : p.tipo === "Asistencia" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {p.tipo}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">No hay pendientes para los filtros seleccionados</div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card card-body text-center text-slate-500">Cargando...</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID_OBRA</th>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Personal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.nombre}</td>
                    <td>{o.ubicacion}</td>
                    <td><span className={`badge ${badgeObra(o.estado)}`}>{o.estado}</span></td>
                    <td>{o.personal ?? 0}</td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => openEdit(o)}><Pencil className="w-4 h-4 text-slate-600" /></button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => removeRow(o)}><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!!rows.length && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Obra" : "Crear Nueva Obra"}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} disabled={saving} onClick={save}>
              {editingId ? "Guardar cambios" : "Crear Obra"}
            </button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="label">ID Obra</label>
            <input className="input" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nombre de la obra</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Ubicación / Ciudad</label>
            <input className="input" value={form.ubicacion} onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))} />
            {formErr.ubicacion && <p className="text-xs text-red-600 mt-1">{formErr.ubicacion}</p>}
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option value="activa">activa</option>
              <option value="finalizada">finalizada</option>
              <option value="suspendida">suspendida</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
