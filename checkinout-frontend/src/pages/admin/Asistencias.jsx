import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as asistenciasService from "../../services/asistenciasService";
import { getNombresObras } from "../../services/obrasService";
import { listTrabajadoresParaSelect } from "../../services/personalService";

const PAGE_SIZE = 10;

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmtFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function badgeClass(estado) {
  if (estado === "Presente") return "bg-[#4CAF50] text-white";
  if (estado === "Salida") return "bg-[#F44336] text-white";
  return "bg-slate-400 text-white";
}

export default function Asistencias() {
  const [q, setQ] = useState("");
  const [obra, setObra] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoRegistro, setTipoRegistro] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, asistenciaDia: 0, activosEmpresa: 0 });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [obrasOpts, setObrasOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [trabSearch, setTrabSearch] = useState("");
  const [form, setForm] = useState({
    trabajadorId: "",
    obra: "",
    fecha: hoyIso(),
    ingreso: "",
    salida: "",
    estado: "",
  });
  const [formErr, setFormErr] = useState({});

  const trabajadoresOpts = useMemo(() => {
    const t = trabSearch.trim().toLowerCase();
    const all = listTrabajadoresParaSelect();
    if (!t) return all;
    return all.filter((x) => x.label.toLowerCase().includes(t));
  }, [trabSearch]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await asistenciasService.getAll({
      search: q,
      obra,
      fecha,
      estado,
      tipo: tipoRegistro,
    });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setRows([]);
      return;
    }
    setRows(res.data.rows);
    setStats(res.data.stats);
  }, [q, obra, fecha, estado, tipoRegistro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    (async () => {
      const r = await getNombresObras();
      if (r.ok) setObrasOpts(r.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, obra, fecha, estado, tipoRegistro]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const abrirCrear = () => {
    setEditing(null);
    setFormErr({});
    setTrabSearch("");
    setForm({
      trabajadorId: "",
      obra: obrasOpts[0] || "",
      fecha: hoyIso(),
      ingreso: "",
      salida: "",
      tipo: "Normal",
      estado: "",
    });
    setModalOpen(true);
  };

  const abrirEditar = async (row) => {
    setEditing(row);
    setFormErr({});
    setTrabSearch("");
    const res = await asistenciasService.getById(row.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    const r = res.data;
    setForm({
      trabajadorId: String(r.trabajadorId),
      obra: r.obra,
      fecha: r.fecha,
      ingreso: r.ingreso || "",
      salida: r.salida || "",
      tipo: r.tipo || "Normal",
      estado: r.estado,
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.trabajadorId) e.trabajadorId = "Seleccione un trabajador";
    if (!form.obra) e.obra = "Obligatorio";
    if (!form.fecha) e.fecha = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const datos = {
      trabajadorId: Number(form.trabajadorId),
      obra: form.obra,
      fecha: form.fecha,
      ingreso: form.ingreso.trim(),
      salida: form.salida.trim(),
      tipo: form.tipo,
      estado: form.estado || undefined,
    };
    const res = editing
      ? await asistenciasService.update(editing.id, datos)
      : await asistenciasService.create(datos);
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({
      type: "ok",
      message: editing ? "Asistencia actualizada" : "Asistencia registrada",
    });
    setModalOpen(false);
    await cargar();
  };

  const eliminar = async (row) => {
    if (!window.confirm(`¿Eliminar el registro de asistencia de ${row.nombre}?`)) return;
    setLoading(true);
    const res = await asistenciasService.remove(row.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Registro eliminado" });
      await cargar();
    }
  };

  return (
    <>
      <TopBar
        title="Gestión Asistencias"
        right={(
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Registrar Asistencia
          </button>
        )}
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.asistenciaDia}%</div>
            <div className="text-sm text-slate-500">Asistencia del día</div>
          </div>
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.activosEmpresa}</div>
            <div className="text-sm text-slate-500">Activos (empresa)</div>
          </div>
        </div>

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>
            <option value="">Obra</option>
          <select className="select" value={tipoRegistro} onChange={(e) => setTipoRegistro(e.target.value)}>
            <option value="">Tipo registro</option>
            <option value="Normal">Normal</option>
            <option value="Permiso">Permiso</option>
            <option value="Incapacidad">Incapacidad</option>
          </select>
            {obrasOpts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option>Salida</option>
            <option>Presente</option>
            <option>Ausente</option>
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
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Obra</th>
                  <th>Fecha</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Estado</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => {
                  const salidaTxt = r.salida && String(r.salida).trim() ? r.salida : "--";
                  return (
                    <tr key={r.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                      <td>{r.id}</td>
                      <td>{r.nombre}</td>
                      <td>{r.obra}</td>
                      <td>{fmtFecha(r.fecha)}</td>
                      <td>{r.ingreso && String(r.ingreso).trim() ? r.ingreso : "--"}</td>
                      <td>{salidaTxt}</td>
                      <td>
                        <span className={`badge border-0 ${badgeClass(r.estado)}`}>{r.estado}</span>
                      </td>
                      <td className="flex gap-2">
                        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => abrirEditar(r)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => eliminar(r)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar asistencia" : "Registrar asistencia"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1565C0" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Guardar" : "Registrar"}
            </button>
          </>
        )}
      >
        <form className="space-y-4" onSubmit={guardar}>
          <div>
            <label className="label">Trabajador</label>
            <input
              className="input mb-2"
              placeholder="Buscar por nombre o documento…"
              value={trabSearch}
              onChange={(e) => setTrabSearch(e.target.value)}
            />
            <select
              className="select"
              value={form.trabajadorId}
              onChange={(e) => setForm((f) => ({ ...f, trabajadorId: e.target.value }))}
            >
              <option value="">Seleccione…</option>
              {trabajadoresOpts.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {formErr.trabajadorId && <p className="text-xs text-red-600 mt-1">{formErr.trabajadorId}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Obra</label>
              <select className="select" value={form.obra} onChange={(e) => setForm((f) => ({ ...f, obra: e.target.value }))}>
                <option value="">Seleccione…</option>
                {obrasOpts.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {formErr.obra && <p className="text-xs text-red-600 mt-1">{formErr.obra}</p>}
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
              {formErr.fecha && <p className="text-xs text-red-600 mt-1">{formErr.fecha}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Hora ingreso</label>
              <input className="input" placeholder="06:00" value={form.ingreso} onChange={(e) => setForm((f) => ({ ...f, ingreso: e.target.value }))} />
            </div>
            <div>
              <label className="label">Hora salida (opcional)</label>
              <input className="input" placeholder="18:00" value={form.salida} onChange={(e) => setForm((f) => ({ ...f, salida: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
              <option>Normal</option>
              <option>Permiso</option>
              <option>Incapacidad</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option>Presente</option>
              <option>Ausente</option>
              <option>Salida</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
