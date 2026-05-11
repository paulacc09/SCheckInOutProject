import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";

const PAGE_SIZE = 10;

const initialForm = () => ({
  nombre: "",
  apellido: "",
  email: "",
  rol: "inspector_sst",
  obra_id: "",
  estado: "activo",
});

function badgeRol(rol) {
  if (rol === "inspector_sst") return "bg-[#22c55e] text-white";
  if (rol === "encargado") return "bg-[#f59e0b] text-white";
  if (rol === "administrador") return "bg-[#3b82f6] text-white";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

function etiquetaRol(rol) {
  if (rol === "inspector_sst") return "Inspector SST";
  if (rol === "encargado") return "Encargado";
  if (rol === "administrador") return "Administrador";
  return rol || "—";
}

export default function Roles() {
  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [lista, setLista] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formErr, setFormErr] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const params = {};
      if (rolFiltro) params.rol = rolFiltro;
      const { data } = await api.get("/usuarios", { params });
      let rows = Array.isArray(data) ? data : data.data ?? [];
      const qt = q.trim().toLowerCase();
      if (qt) {
        rows = rows.filter((u) => {
          const n = `${u.nombre || ""} ${u.apellido || ""} ${u.email || ""}`.toLowerCase();
          return n.includes(qt);
        });
      }
      setLista(rows);
    } catch (e) {
      setFlash({
        type: "error",
        message: e.response?.data?.message || "No se pudieron cargar los usuarios",
      });
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [q, rolFiltro]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/obras");
        setObras(Array.isArray(data) ? data : data.data ?? []);
      } catch {
        setObras([]);
      }
    })();
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPage(1);
  }, [q, rolFiltro]);

  const { items: rows, totalPages, page: safePage } = useMemo(
    () => paginate(lista, page, PAGE_SIZE),
    [lista, page]
  );

  const abrirCrear = () => {
    setEditingId(null);
    setFormErr({});
    setForm(initialForm());
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditingId(u.id);
    setFormErr({});
    setForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      email: u.email || "",
      rol: u.rol || "inspector_sst",
      obra_id: u.obra_id != null ? String(u.obra_id) : "",
      estado: u.estado || "activo",
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    if (!form.apellido.trim()) e.apellido = "Obligatorio";
    if (!editingId) {
      if (!form.email.trim()) e.email = "Obligatorio";
    }
    if (!form.rol) e.rol = "Obligatorio";
    if (form.rol !== "administrador" && !String(form.obra_id || "").trim()) {
      e.obra_id = "Obligatorio";
    }
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setFlash(null);
    const obraPayload =
      form.rol === "administrador" ? null : form.obra_id ? Number(form.obra_id) : null;
    try {
      if (!editingId) {
        await api.post("/usuarios", {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          rol: form.rol,
          obra_id: obraPayload,
        });
        setFlash({ type: "ok", message: "Usuario creado" });
      } else {
        const body = {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          rol: form.rol,
          obra_id: obraPayload,
          estado: form.estado,
        };
        await api.put(`/usuarios/${editingId}`, body);
        setFlash({ type: "ok", message: "Usuario actualizado" });
      }
      setModalOpen(false);
      await cargar();
    } catch (err) {
      setFlash({
        type: "error",
        message: err.response?.data?.message || "No se pudo guardar",
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (u) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    setFlash(null);
    try {
      await api.delete(`/usuarios/${u.id}`);
      setFlash({ type: "ok", message: "Usuario eliminado" });
      await cargar();
    } catch (err) {
      setFlash({
        type: "error",
        message: err.response?.data?.message || "No se pudo eliminar",
      });
    }
  };

  const obrasParaSelect = form.rol !== "administrador" ? obras : [];

  return (
    <>
      <TopBar
        title="Roles y usuarios"
        right={
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Crear Usuario
          </button>
        }
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && (
          <FlashBanner
            type={flash.type === "error" ? "error" : "ok"}
            message={flash.message}
            onClose={() => setFlash(null)}
          />
        )}

        <div className="card card-body flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Buscar por nombre, apellido o email…"
            />
          </div>
          <select className="select sm:w-56" value={rolFiltro} onChange={(ev) => setRolFiltro(ev.target.value)}>
            <option value="">Todos los roles</option>
            <option value="inspector_sst">Inspector SST</option>
            <option value="encargado">Encargado</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a6e]" />
          </div>
        ) : lista.length === 0 ? (
          <div className="card card-body text-center text-slate-500">No hay usuarios que coincidan.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Obra</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>
                        {r.nombre ?? ""} {r.apellido ?? ""}
                      </td>
                      <td>{r.email ?? "—"}</td>
                      <td>
                        <span className={`badge ${badgeRol(r.rol)}`}>{etiquetaRol(r.rol)}</span>
                      </td>
                      <td>{obras.find((o) => String(o.id) === String(r.obra_id))?.nombre ?? "—"}</td>
                      <td>
                        <span
                          className={`badge ${r.estado === "activo" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}
                        >
                          {r.estado ?? "—"}
                        </span>
                      </td>
                      <td className="flex gap-2">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-slate-100"
                          onClick={() => abrirEditar(r)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-slate-100"
                          onClick={() => eliminar(r)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar usuario" : "Crear usuario"}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn text-white"
              style={{ background: "#1e3a6e" }}
              disabled={saving}
              onClick={guardar}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Guardar" : "Crear"}
            </button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={guardar}>
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={form.nombre}
              onChange={(ev) => setForm((f) => ({ ...f, nombre: ev.target.value }))}
            />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              className="input"
              value={form.apellido}
              onChange={(ev) => setForm((f) => ({ ...f, apellido: ev.target.value }))}
            />
            {formErr.apellido && <p className="text-xs text-red-600 mt-1">{formErr.apellido}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              disabled={Boolean(editingId)}
              onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
            />
            {formErr.email && <p className="text-xs text-red-600 mt-1">{formErr.email}</p>}
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              className="select"
              value={form.rol}
              onChange={(ev) => {
                const rol = ev.target.value;
                setForm((f) => ({
                  ...f,
                  rol,
                  obra_id: rol === "administrador" ? "" : f.obra_id,
                }));
              }}
            >
              <option value="inspector_sst">Inspector SST</option>
              <option value="encargado">Encargado</option>
              <option value="administrador">Administrador</option>
            </select>
            {formErr.rol && <p className="text-xs text-red-600 mt-1">{formErr.rol}</p>}
          </div>
          {editingId ? (
            <div>
              <label className="label">Estado</label>
              <select
                className="select"
                value={form.estado || "activo"}
                onChange={(ev) => setForm((f) => ({ ...f, estado: ev.target.value }))}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          ) : null}
          {form.rol !== "administrador" && (
            <div>
              <label className="label">Obra</label>
              <select
                className="select"
                value={form.obra_id}
                onChange={(ev) => setForm((f) => ({ ...f, obra_id: ev.target.value }))}
              >
                <option value="">Seleccionar obra</option>
                {obrasParaSelect.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
              {formErr.obra_id && <p className="text-xs text-red-600 mt-1">{formErr.obra_id}</p>}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
