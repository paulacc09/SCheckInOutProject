import { useEffect, useState } from "react";
import { Plus, Search, Loader2, MapPin, Users as UsersIcon, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

const ESTADO_BADGE = {
  activa:     "badge badge-success",
  finalizada: "badge badge-muted",
  suspendida: "badge badge-warning",
};

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "", nombre: "", direccion: "", ciudad: "",
    estado: "activa", responsable_sst_id: "", id_dispositivo: "",
  });

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/obras");
      setObras(data.obras || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudieron cargar las obras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtradas = obras.filter((o) => {
    const t = q.toLowerCase();
    return !t ||
      (o.nombre || "").toLowerCase().includes(t) ||
      (o.codigo || "").toLowerCase().includes(t) ||
      (o.ciudad || "").toLowerCase().includes(t);
  });

  const onCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/obras", form);
      setOpenModal(false);
      setForm({ codigo: "", nombre: "", direccion: "", ciudad: "", estado: "activa", responsable_sst_id: "", id_dispositivo: "" });
      await cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al crear la obra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar
        title="Mis Obras"
        subtitle="Gestiona los proyectos de construcción de tu empresa"
        right={
          <button onClick={() => setOpenModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Crear Obra
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filtros */}
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
              placeholder="Buscar por código, nombre o ciudad…"
            />
          </div>
          <select className="select sm:w-40">
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="finalizada">Finalizada</option>
            <option value="suspendida">Suspendida</option>
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Aún no hay obras"
              message="Crea tu primera obra para comenzar a gestionar la asistencia."
              action={
                <button onClick={() => setOpenModal(true)} className="btn btn-primary">
                  <Plus className="w-4 h-4" /> Crear Obra
                </button>
              }
            />
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
                </tr>
              </thead>
              <tbody>
                {filtradas.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.codigo}</td>
                    <td className="font-medium text-slate-800">{o.nombre}</td>
                    <td className="text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {o.ciudad || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={ESTADO_BADGE[o.estado] || "badge badge-muted"}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                        {o.personal_asignado ?? o.total_personal ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Crear nueva obra"
        size="lg"
        footer={
          <>
            <button onClick={() => setOpenModal(false)} className="btn btn-outline">Cancelar</button>
            <button onClick={onCrear} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Crear Obra
            </button>
          </>
        }
      >
        <form onSubmit={onCrear} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Código de obra</label>
            <input className="input" required value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              placeholder="Ej. 26IBG02" />
          </div>
          <div>
            <label className="label">Nombre de la obra</label>
            <input className="input" required value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del proyecto" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dirección / Ubicación</label>
            <input className="input" value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Dirección completa" />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input className="input" value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
          </div>
          <div>
            <label className="label">Estado inicial</label>
            <select className="select" value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="activa">Activa</option>
              <option value="suspendida">Suspendida</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">ID Dispositivo principal (opcional)</label>
            <input className="input" value={form.id_dispositivo}
              onChange={(e) => setForm({ ...form, id_dispositivo: e.target.value })}
              placeholder="ID del dispositivo de marcaje" />
          </div>
        </form>
      </Modal>
    </>
  );
}
