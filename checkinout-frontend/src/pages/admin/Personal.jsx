import { useEffect, useState } from "react";
import { Plus, Search, Loader2, Pencil, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

export default function Personal() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", apellido: "", cedula: "", telefono: "",
    email: "", subcargo_id: "", estado: "activo",
  });

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/trabajadores");
      setTrabajadores(data.trabajadores || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cargar el personal");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditing(null);
    setForm({ nombre: "", apellido: "", cedula: "", telefono: "", email: "", subcargo_id: "", estado: "activo" });
    setOpenModal(true);
  };
  const abrirEditar = (t) => {
    setEditing(t);
    setForm({
      nombre: t.nombre || "", apellido: t.apellido || "", cedula: t.cedula || "",
      telefono: t.telefono || "", email: t.email || "",
      subcargo_id: t.subcargo_id || "", estado: t.estado || "activo",
    });
    setOpenModal(true);
  };

  const onGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/trabajadores/${editing.id}`, form);
      else await api.post("/trabajadores", form);
      setOpenModal(false);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar trabajador");
    } finally {
      setSaving(false);
    }
  };

  const filtrados = trabajadores.filter((t) => {
    const txt = q.toLowerCase();
    const okQ = !txt ||
      `${t.nombre} ${t.apellido}`.toLowerCase().includes(txt) ||
      (t.cedula || "").toLowerCase().includes(txt);
    const okEstado = !estado || t.estado === estado;
    return okQ && okEstado;
  });

  return (
    <>
      <TopBar
        title="Gestión Personal"
        subtitle="Administra los trabajadores de tu empresa"
        right={<button onClick={abrirCrear} className="btn btn-primary"><Plus className="w-4 h-4" /> Registrar Trabajador</button>}
      />
      <div className="p-6 space-y-4">
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o cédula…" />
          </div>
          <select className="select sm:w-40" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> {error}</div>
        ) : filtrados.length === 0 ? (
          <div className="card">
            <EmptyState title="Sin trabajadores" message="Aún no has registrado personal." action={
              <button onClick={abrirCrear} className="btn btn-primary"><Plus className="w-4 h-4" /> Registrar trabajador</button>
            }/>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((t) => (
                  <tr key={t.id}>
                    <td className="text-slate-500">{t.id}</td>
                    <td className="font-medium text-slate-800">{t.nombre} {t.apellido}</td>
                    <td className="font-mono text-xs">{t.cedula}</td>
                    <td className="text-slate-600">{t.subcargo_nombre || t.cargo || "—"}</td>
                    <td>
                      <span className={t.estado === "activo" ? "badge badge-success" : "badge badge-muted"}>
                        {t.estado}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Editar">
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? "Editar trabajador" : "Registrar trabajador"}
        size="lg"
        footer={
          <>
            <button onClick={() => setOpenModal(false)} className="btn btn-outline">Cancelar</button>
            <button onClick={onGuardar} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? "Guardar cambios" : "Registrar"}
            </button>
          </>
        }
      >
        <form onSubmit={onGuardar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Nombres</label><input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
          <div><label className="label">Apellidos</label><input className="input" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} /></div>
          <div><label className="label">N° documento</label><input className="input" required value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Correo</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label">Estado</label>
            <select className="select" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
