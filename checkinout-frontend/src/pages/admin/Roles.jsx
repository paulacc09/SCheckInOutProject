import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as usuariosService from "../../services/usuariosService";
import { getNombresObras } from "../../services/obrasService";

const PAGE_SIZE = 10;

const ROLE_CLASS = {
  "Inspector SST": "bg-emerald-100 text-emerald-800",
  Encargado: "bg-amber-100 text-amber-900",
  Administrador: "bg-blue-100 text-blue-800",
};

export default function Roles() {
  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [obrasOpts, setObrasOpts] = useState([]);
  const rolesOpts = usuariosService.getRolesOpciones();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
    rol: "Encargado",
    obra: "",
    estado: "Activo",
  });
  const [formErr, setFormErr] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await usuariosService.getAll({
      search: q,
      rol: rolFiltro,
      estado: estadoFiltro,
    });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setLista([]);
      return;
    }
    setLista(res.data);
  }, [q, rolFiltro, estadoFiltro]);

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
  }, [q, rolFiltro, estadoFiltro]);

  const { items: rows, totalPages, page: safePage } = useMemo(
    () => paginate(lista, page, PAGE_SIZE),
    [lista, page]
  );

  const abrirCrear = () => {
    setEditingId(null);
    setFormErr({});
    setForm({
      nombre: "",
      correo: "",
      password: "",
      rol: "Encargado",
      obra: obrasOpts[0] || "",
      estado: "Activo",
    });
    setModalOpen(true);
  };

  const abrirEditar = async (u) => {
    setEditingId(u.id);
    setFormErr({});
    const res = await usuariosService.getById(u.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setForm({
      nombre: res.data.nombre,
      correo: res.data.correo,
      password: "",
      rol: res.data.rol,
      obra: res.data.obra,
      estado: res.data.estado,
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    if (!form.correo.trim()) e.correo = "Obligatorio";
    if (!editingId && !form.password.trim()) e.password = "Obligatorio";
    if (!form.rol) e.rol = "Obligatorio";
    if (!form.obra) e.obra = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const payload = { ...form };
    if (editingId && !payload.password.trim()) delete payload.password;
    const res = editingId
      ? await usuariosService.update(editingId, payload)
      : await usuariosService.create(payload);
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({ type: "ok", message: editingId ? "Usuario actualizado" : "Usuario creado" });
    setModalOpen(false);
    await cargar();
  };

  const cambiarRol = async (id, nuevoRol) => {
    setLoading(true);
    const res = await usuariosService.updateRol(id, nuevoRol);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Rol actualizado" });
      await cargar();
    }
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario ${u.nombre}?`)) return;
    setLoading(true);
    const res = await usuariosService.remove(u.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Usuario eliminado" });
      await cargar();
    }
  };

  return (
    <>
      <TopBar
        right={(
          <button type="button" className="btn text-white rounded-lg" style={{ background: "#1565C0" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Crear Usuario
          </button>
        )}
      />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Roles</h2>
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
          </div>
          <select className="select sm:w-44" value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)}>
            <option value="">Rol</option>
            {rolesOpts.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select className="select sm:w-40" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="">Estado</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
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
                  <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Obra</th><th>Estado</th><th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, idx) => (
                  <tr key={u.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                    <td>{u.id}</td>
                    <td className="font-medium">{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td>
                      <select
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${ROLE_CLASS[u.rol] || "bg-slate-100"}`}
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                      >
                        {rolesOpts.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>{u.obra}</td>
                    <td>
                      <span className={`badge ${u.estado === "Activo" ? "badge-success" : "badge-danger"}`}>{u.estado}</span>
                    </td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => abrirEditar(u)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => eliminar(u)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lista.length > 0 && (
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
        )}

        <div className="text-sm text-slate-600">
          Roles disponibles:{" "}
          <span className="badge bg-emerald-100 text-emerald-700">Inspector SST</span>{" "}
          <span className="badge bg-amber-100 text-amber-700">Encargado</span>{" "}
          <span className="badge bg-blue-100 text-blue-700">Administrador</span>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar usuario" : "Crear usuario"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1565C0" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar
            </button>
          </>
        )}
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={guardar}>
          <div className="sm:col-span-2">
            <label className="label">Nombre</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" disabled={!!editingId} value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} />
            {formErr.correo && <p className="text-xs text-red-600 mt-1">{formErr.correo}</p>}
          </div>
          <div>
            <label className="label">Contraseña {editingId && "(opcional)"}</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
            {formErr.password && <p className="text-xs text-red-600 mt-1">{formErr.password}</p>}
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="select" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
              {rolesOpts.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {formErr.rol && <p className="text-xs text-red-600 mt-1">{formErr.rol}</p>}
          </div>
          <div>
            <label className="label">Obra</label>
            <select className="select" value={form.obra} onChange={(e) => setForm((f) => ({ ...f, obra: e.target.value }))}>
              {obrasOpts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {formErr.obra && <p className="text-xs text-red-600 mt-1">{formErr.obra}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Estado</label>
            <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
