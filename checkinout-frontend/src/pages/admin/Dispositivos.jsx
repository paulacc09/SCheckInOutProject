import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as dispositivosService from "../../services/dispositivosService";
import { getNombresObras } from "../../services/obrasService";

const PAGE_SIZE = 10;

function fmtAcceso(iso) {
  if (!iso) return "—";
  return iso;
}

export default function Dispositivos() {
  const [q, setQ] = useState("");
  const [obra, setObra] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, sinAsignar: 0 });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [obrasOpts, setObrasOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [tipo, setTipo] = useState("Tablet");
  const [form, setForm] = useState({ nombre: "", idManual: "", obra: "", pin: "" });
  const [formErr, setFormErr] = useState({});

  const tipos = dispositivosService.getTiposOpciones();

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await dispositivosService.getAll({ search: q, obra, estado });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setRows([]);
      return;
    }
    setRows(res.data.rows);
    setStats(res.data.stats);
  }, [q, obra, estado]);

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
  }, [q, obra, estado]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const abrirCrear = () => {
    setEditing(null);
    setFormErr({});
    setTipo("Tablet");
    setShowPin(false);
    setForm({ nombre: "", idManual: "", obra: obrasOpts[0] || "", pin: "" });
    setModalOpen(true);
  };

  const abrirEditar = (d) => {
    setEditing(d);
    setFormErr({});
    setTipo(d.tipo);
    setShowPin(false);
    setForm({
      nombre: d.nombre,
      idManual: d.id,
      obra: d.obra === "Sin asignar" ? "" : d.obra,
      pin: d.pin || "",
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    setFormErr(e);
    return !e.nombre;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const datos = {
      nombre: form.nombre.trim(),
      tipo,
      obra: form.obra || "Sin asignar",
      pin: form.pin,
      id: editing ? undefined : form.idManual.trim() || undefined,
    };
    const res = editing
      ? await dispositivosService.update(editing.id, datos)
      : await dispositivosService.create(datos);
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({ type: "ok", message: editing ? "Dispositivo actualizado" : "Dispositivo registrado" });
    setModalOpen(false);
    await cargar();
  };

  const toggleEstado = async (d) => {
    const next = d.estado === "Activo" ? "Inactivo" : "Activo";
    setLoading(true);
    const res = await dispositivosService.updateEstado(d.id, next);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Estado actualizado" });
      await cargar();
    }
  };

  const eliminar = async (d) => {
    if (!window.confirm(`¿Eliminar el dispositivo ${d.nombre}?`)) return;
    setLoading(true);
    const res = await dispositivosService.remove(d.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Dispositivo eliminado" });
      await cargar();
    }
  };

  return (
    <>
      <TopBar
        title="Gestión Dispositivos"
        right={(
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Registrar Dispositivo
          </button>
        )}
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="grid md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border p-4 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500">Total Registrados</div>
          </div>
          <div className="rounded-xl bg-white border p-4 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.activos}</div>
            <div className="text-sm text-slate-500">Activos</div>
          </div>
          <div className="rounded-xl bg-white border p-4 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.inactivos}</div>
            <div className="text-sm text-slate-500">Inactivos</div>
          </div>
          <div className="rounded-xl bg-white border p-4 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.sinAsignar}</div>
            <div className="text-sm text-slate-500">Sin Asignar</div>
          </div>
        </div>

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>
            <option value="">Obra</option>
            {obrasOpts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option>Activo</option>
            <option>Inactivo</option>
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
                  <th>ID</th><th>Nombre</th><th>Tipo</th><th>Obra</th><th>Último Acceso</th><th>Estado</th><th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, idx) => (
                  <tr key={d.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                    <td className="font-mono text-xs">{d.id}</td>
                    <td>{d.nombre}</td>
                    <td>{d.tipo}</td>
                    <td>{d.obra}</td>
                    <td>{fmtAcceso(d.ultimoAcceso)}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge border-0 cursor-pointer ${d.estado === "Activo" ? "badge-success" : "badge-danger"}`}
                        onClick={() => toggleEstado(d)}
                      >
                        {d.estado}
                      </button>
                    </td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => abrirEditar(d)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => eliminar(d)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Dispositivo" : "Registrar Dispositivo"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Guardar" : "Registrar"}
            </button>
          </>
        )}
      >
        <p className="text-sm text-slate-500 mb-3">Agregar un nuevo dispositivo de marcaje</p>
        <form className="space-y-4" onSubmit={guardar}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tipos.map((t) => (
              <button key={t} type="button" className={`btn text-sm ${tipo === t ? "btn-primary" : "btn-outline"}`} onClick={() => setTipo(t)}>
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Nombre / Descripción</label>
            <input className="input" placeholder="El Tablet entrada obra" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">ID dispositivo</label>
            <input className="input" placeholder="DEV-001 (auto si vacío)" value={form.idManual} onChange={(e) => setForm((f) => ({ ...f, idManual: e.target.value }))} />
          </div>
          <div>
            <label className="label">Obra asignada</label>
            <select className="select" value={form.obra} onChange={(e) => setForm((f) => ({ ...f, obra: e.target.value }))}>
              <option value="">Sin asignar</option>
              {obrasOpts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Código de acceso</label>
            <div className="relative">
              <input type={showPin ? "text" : "password"} className="input pr-10" placeholder="PIN 4 a 6 dígitos" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPin((v) => !v)}>
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
