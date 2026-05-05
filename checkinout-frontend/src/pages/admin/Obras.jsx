import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import FlashBanner from "../../components/FlashBanner";
import PaginationBar from "../../components/PaginationBar";
import { paginate } from "../../services/pagination";
import * as obrasService from "../../services/obrasService";

const PAGE_SIZE = 10;

function badgeObra(estado) {
  if (estado === "activa") return "bg-[#4CAF50] text-white";
  if (estado === "suspendida") return "bg-orange-400 text-white";
  return "bg-slate-500 text-white";
}

function labelEstado(estado) {
  if (estado === "activa") return "Activa";
  if (estado === "suspendida") return "Suspendida";
  return "Finalizada";
}

export default function Obras() {
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [lista, setLista] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [encargadosOpts, setEncargadosOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedObra, setSelectedObra] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    ubicacion: "",
    encargado: "",
    fechaInicio: "",
    estado: "activa",
  });
  const [formErr, setFormErr] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await obrasService.getAll({ search: q, estado: filtroEstado });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setLista([]);
      return;
    }
    setLista(res.data);
  }, [q, filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    (async () => {
      const r = await obrasService.getEncargadosOpciones();
      if (r.ok) setEncargadosOpts(r.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, filtroEstado]);

  const stats = useMemo(() => {
    const total = lista.length;
    const activos = lista.filter((o) => o.estado === "activa").length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [lista]);
  const { items: pageRows, total, totalPages, page: safePage } = useMemo(
    () => paginate(lista, page, PAGE_SIZE),
    [lista, page]
  );

  const abrirCrear = () => {
    setEditing(null);
    setFormErr({});
    setForm({
      nombre: "",
      codigo: String(8000 + lista.length + 1).padStart(5, "0"),
      ubicacion: "",
      encargado: encargadosOpts[0]?.value || "",
      fechaInicio: "",
      estado: "activa",
    });
    setModalOpen(true);
  };

  const abrirEditar = async (row) => {
    setEditing(row);
    setFormErr({});
    const res = await obrasService.getById(row.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    const o = res.data;
    setForm({
      nombre: o.nombre,
      codigo: o.codigo || "",
      ubicacion: o.ubicacion,
      encargado: o.encargado,
      fechaInicio: o.fechaInicio,
      estado: o.estado,
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    if (!form.ubicacion.trim()) e.ubicacion = "Obligatorio";
    if (!form.codigo.trim()) e.codigo = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const datos = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      ubicacion: form.ubicacion.trim(),
      encargado: form.encargado,
      fechaInicio: form.fechaInicio,
      estado: form.estado,
    };
    const res = editing
      ? await obrasService.update(editing.id, datos)
      : await obrasService.create(datos);
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({ type: "ok", message: editing ? "Obra actualizada" : "Obra creada" });
    setModalOpen(false);
    await cargar();
  };

  const eliminar = async (row) => {
    if (!window.confirm(`¿Eliminar la obra "${row.nombre}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    const res = await obrasService.remove(row.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Obra eliminada" });
      await cargar();
    }
  };

  const abrirDetalle = async (row) => {
    const res = await obrasService.getById(row.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setSelectedObra(res.data);
  };

  if (selectedObra) {
    return (
      <>
        <TopBar title={`${selectedObra.nombre} (${selectedObra.codigo})`} />
        <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
          <button className="btn btn-outline" onClick={() => setSelectedObra(null)}>Volver a la lista</button>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="card card-body"><div className="text-2xl font-bold">{selectedObra.personal}</div><div className="text-sm text-slate-500">Personal Asignado</div></div>
            <div className="card card-body"><div className="text-2xl font-bold">{selectedObra.presente}</div><div className="text-sm text-slate-500">Personal Presente</div></div>
            <div className="card card-body"><div className="text-2xl font-bold">{selectedObra.porcentajeAsistencia}%</div><div className="text-sm text-slate-500">% Asistencia Promedio Hoy</div></div>
            <div className="card card-body"><div className="text-2xl font-bold">{selectedObra.asistSinJustificar}</div><div className="text-sm text-slate-500">Asistencias sin Justificar</div></div>
            <div className="card card-body"><div className="text-2xl font-bold">{selectedObra.pendientesCount}</div><div className="text-sm text-slate-500">Pendientes</div></div>
          </div>
          <div className="card card-body">
            <h3 className="font-semibold text-slate-800 mb-2">Pendientes</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {selectedObra.pendientes?.length ? selectedObra.pendientes.map((p, i) => <li key={`${p}-${i}`}>- {p}</li>) : <li>- Sin pendientes</li>}
            </ul>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Mis Obras"
        right={(
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Crear Obra
          </button>
        )}
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500">Total (filtro actual)</div>
          </div>
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.activos}</div>
            <div className="text-sm text-slate-500">Activas</div>
          </div>
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.inactivos}</div>
            <div className="text-sm text-slate-500">Otras</div>
          </div>
        </div>

        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
              placeholder="Buscar por nombre, ubicación o encargado…"
            />
          </div>
          <select className="select sm:w-44" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#1565C0]" />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Personal</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o, idx) => (
                  <tr key={o.id} className={`${idx % 2 ? "bg-slate-50/50" : ""} cursor-pointer`} onClick={() => abrirDetalle(o)}>
                    <td>{o.codigo}</td>
                    <td className="font-medium">{o.nombre}</td>
                    <td>{o.ubicacion}</td>
                    <td>
                      <span className={`badge border-0 ${badgeObra(o.estado)}`}>{labelEstado(o.estado)}</span>
                    </td>
                    <td>{o.personal}</td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); abrirEditar(o); }}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); eliminar(o); }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Obra" : "Crear Obra"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Guardar cambios" : "Crear Obra"}
            </button>
          </>
        )}
      >
        <form className="space-y-4" onSubmit={guardar}>
          <div>
            <label className="label">Nombre de la obra</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Código</label>
            <input className="input" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
            {formErr.codigo && <p className="text-xs text-red-600 mt-1">{formErr.codigo}</p>}
          </div>
          <div>
            <label className="label">Ubicación / Ciudad</label>
            <input className="input" value={form.ubicacion} onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))} />
            {formErr.ubicacion && <p className="text-xs text-red-600 mt-1">{formErr.ubicacion}</p>}
          </div>
          <div>
            <label className="label">Encargado</label>
            <select className="select" value={form.encargado} onChange={(e) => setForm((f) => ({ ...f, encargado: e.target.value }))}>
              <option value="">Seleccione…</option>
              {encargadosOpts.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {formErr.encargado && <p className="text-xs text-red-600 mt-1">{formErr.encargado}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha inicio</label>
              <input type="date" className="input" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} />
              {formErr.fechaInicio && <p className="text-xs text-red-600 mt-1">{formErr.fechaInicio}</p>}
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
                <option value="activa">Activa</option>
                <option value="suspendida">Suspendida</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
