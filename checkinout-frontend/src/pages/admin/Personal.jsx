import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as personalService from "../../services/personalService";
import { getNombresObras } from "../../services/obrasService";

const PAGE_SIZE = 10;

export default function Personal() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [obraFiltro, setObraFiltro] = useState("");
  const [cargo, setCargo] = useState("");
  const [page, setPage] = useState(1);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [obrasOpts, setObrasOpts] = useState([]);
  const [cargosOpts, setCargosOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    cargo: "",
    obra: "",
    correo: "",
    telefono: "",
    estado: "activo",
  });
  const [formErr, setFormErr] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await personalService.getAll({
      search: q,
      obra: obraFiltro,
      cargo,
      estado,
    });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setLista([]);
      return;
    }
    setLista(res.data);
  }, [q, estado, obraFiltro, cargo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    (async () => {
      const r = await getNombresObras();
      if (r.ok) setObrasOpts(r.data);
    })();
    setCargosOpts(personalService.getCargosOpciones());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, estado, obraFiltro, cargo]);

  const { items: rows, total, totalPages, page: safePage } = useMemo(
    () => paginate(lista, page, PAGE_SIZE),
    [lista, page]
  );

  const abrirCrear = () => {
    setEditingId(null);
    setFormErr({});
    setForm({
      nombre: "",
      documento: "",
      cargo: "",
      obra: obrasOpts[0] || "",
      correo: "",
      telefono: "",
      estado: "activo",
    });
    setModalOpen(true);
  };

  const abrirEditar = async (row) => {
    setEditingId(row.id);
    setFormErr({});
    const res = await personalService.getById(row.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    const t = res.data;
    setForm({
      nombre: t.nombre,
      documento: t.documento,
      cargo: t.cargo,
      obra: t.obra,
      correo: t.correo || "",
      telefono: t.telefono || "",
      estado: t.estado,
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    if (!form.documento.trim()) e.documento = "Obligatorio";
    if (!form.cargo) e.cargo = "Obligatorio";
    if (!form.obra) e.obra = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    let res;
    if (editingId) {
      res = await personalService.update(editingId, form);
    } else {
      res = await personalService.create(form);
    }
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({ type: "ok", message: editingId ? "Trabajador actualizado" : "Trabajador registrado" });
    setModalOpen(false);
    await cargar();
  };

  const eliminar = async (row) => {
    if (!window.confirm(`¿Eliminar a ${row.nombre}? Esta acción no se puede deshacer`)) return;
    setLoading(true);
    const res = await personalService.remove(row.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Trabajador eliminado" });
      await cargar();
    }
  };

  return (
    <>
      <TopBar
        title="Gestión Personal"
        right={(
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Registrar Trabajador
          </button>
        )}
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && (
          <FlashBanner
            type={flash.type === "error" ? "error" : "ok"}
            message={flash.message}
            onClose={() => setFlash(null)}
          />
        )}

        <div className="card card-body flex flex-col lg:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
              placeholder="Buscar por nombre o documento…"
            />
          </div>
          <select className="select sm:w-40" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <select className="select sm:w-44" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="">Todos los cargos</option>
            {cargosOpts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="select sm:w-44" value={obraFiltro} onChange={(e) => setObraFiltro(e.target.value)}>
            <option value="">Todas las obras</option>
            {obrasOpts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
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
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Obra</th>
                  <th>Estado</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, idx) => (
                  <tr key={t.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                    <td>{t.id}</td>
                    <td className="font-medium">{t.nombre}</td>
                    <td className="font-mono text-xs">{t.documento}</td>
                    <td>{t.cargo}</td>
                    <td>{t.obra}</td>
                    <td>
                      <span className={`badge ${t.estado === "activo" ? "badge-success" : "badge-danger"}`}>
                        {t.estado === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" title="Editar" onClick={() => abrirEditar(t)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" title="Eliminar" onClick={() => eliminar(t)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar trabajador" : "Registrar trabajador"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1565C0" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Guardar" : "Registrar"}
            </button>
          </>
        )}
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={guardar}>
          <div className="sm:col-span-2">
            <label className="label">Nombre completo</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Documento</label>
            <input className="input" disabled={!!editingId} value={form.documento} onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))} />
            {formErr.documento && <p className="text-xs text-red-600 mt-1">{formErr.documento}</p>}
          </div>
          <div>
            <label className="label">Cargo</label>
            <select className="select" value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}>
              <option value="">Seleccionar</option>
              {cargosOpts.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {formErr.cargo && <p className="text-xs text-red-600 mt-1">{formErr.cargo}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Obra</label>
            <select className="select" value={form.obra} onChange={(e) => setForm((f) => ({ ...f, obra: e.target.value }))}>
              <option value="">Seleccionar</option>
              {obrasOpts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {formErr.obra && <p className="text-xs text-red-600 mt-1">{formErr.obra}</p>}
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <span className="text-sm font-medium">Estado</span>
            <button
              type="button"
              className={`relative w-12 h-7 rounded-full transition-colors ${form.estado === "activo" ? "bg-[#4CAF50]" : "bg-slate-300"}`}
              onClick={() => setForm((f) => ({ ...f, estado: f.estado === "activo" ? "inactivo" : "activo" }))}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${form.estado === "activo" ? "right-1" : "left-1"}`} />
            </button>
            <span className="text-sm text-slate-600">{form.estado === "activo" ? "Activo" : "Inactivo"}</span>
          </div>
        </form>
      </Modal>
    </>
  );
}
