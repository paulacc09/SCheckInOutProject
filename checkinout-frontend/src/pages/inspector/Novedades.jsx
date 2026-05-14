import { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

const formatearFechaTabla = (f) => {
  if (!f) return "—";
  const raw = String(f).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(f);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return String(f);
};

const truncarDescripcion = (text, max = 60) => {
  const s = String(text || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
};

const etiquetaTipo = (t) => {
  const map = {
    accidente: "Accidente",
    incidente: "Incidente",
    condicion_insegura: "Condición insegura",
    otro: "Otro",
  };
  return map[t] || t || "—";
};

const etiquetaEstado = (e) => {
  const map = { abierta: "Abierta", en_gestion: "En gestión", cerrada: "Cerrada" };
  return map[e] || e || "—";
};

const badgeEstado = (estado) => {
  if (estado === "cerrada") return "badge badge-success";
  if (estado === "en_gestion") return "badge badge-warning";
  return "badge badge-danger";
};

const badgeTipo = (tipo) => {
  if (tipo === "accidente") return "badge badge-danger";
  if (tipo === "incidente") return "badge badge-warning";
  if (tipo === "condicion_insegura") return "badge badge-info";
  return "badge badge-muted";
};

export default function Novedades() {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [obras, setObras] = useState([]);
  const [form, setForm] = useState({
    obra_id: "",
    tipo: "incidente",
    descripcion: "",
    fecha: "",
  });

  const cargar = async () => {
    const { data } = await api.get("/novedades");
    const rows = data.data || data || [];
    setNovedades(Array.isArray(rows) ? rows : []);
  };

  const abrirModal = () => {
    setForm({
      obra_id: "",
      tipo: "incidente",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 10),
    });
    setOpenModal(true);
  };

  const onGuardar = async () => {
    if (!String(form.obra_id).trim() || !form.tipo || !String(form.descripcion).trim()) {
      alert("Selecciona la obra, el tipo y escribe una descripción.");
      return;
    }
    setSaving(true);
    try {
      console.log("NOVEDAD payload:", JSON.stringify(form));
      await api.post("/novedades", {
        obra_id: form.obra_id,
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        fecha: form.fecha || undefined,
      });
      setOpenModal(false);
      await cargar();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo registrar la novedad"
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const iniciar = async () => {
      setLoading(true);
      setError("");
      try {
        const [novRes, obrasRes] = await Promise.all([api.get("/novedades"), api.get("/obras")]);
        if (!alive) return;
        const nov = novRes.data.data || novRes.data;
        const obs = obrasRes.data.obras || obrasRes.data.data || obrasRes.data;
        setNovedades(Array.isArray(nov) ? nov : []);
        setObras(Array.isArray(obs) ? obs : []);
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || err.response?.data?.mensaje || err.message || "Error al cargar");
        setNovedades([]);
        setObras([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    iniciar();
    return () => {
      alive = false;
    };
  }, []);

  const maxFecha = new Date().toISOString().slice(0, 10);

  return (
    <>
      <TopBar
        title="Novedades"
        subtitle="Registro de incidentes y novedades en tu obra"
        right={
          <button type="button" onClick={abrirModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Nueva Novedad
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        ) : novedades.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Sin novedades"
              message="No hay novedades registradas en tu obra."
              action={
                <button type="button" onClick={abrirModal} className="btn btn-primary">
                  <Plus className="w-4 h-4" /> Nueva Novedad
                </button>
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Obra</th>
                  <th>
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Tipo
                    </span>
                  </th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {novedades.map((n) => (
                  <tr key={n.id}>
                    <td className="text-slate-700 whitespace-nowrap">{formatearFechaTabla(n.fecha)}</td>
                    <td className="text-slate-700">{n.obra_nombre || "—"}</td>
                    <td>
                      <span className={badgeTipo(n.tipo)}>{etiquetaTipo(n.tipo)}</span>
                    </td>
                    <td className="text-slate-600 max-w-xs">{truncarDescripcion(n.descripcion)}</td>
                    <td>
                      <span className={badgeEstado(n.estado)}>{etiquetaEstado(n.estado)}</span>
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
        title="Registrar Novedad"
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setOpenModal(false)} className="btn btn-outline">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onGuardar}
              disabled={saving}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Obra</label>
            <select
              className="select w-full"
              value={form.obra_id}
              onChange={(e) => setForm((f) => ({ ...f, obra_id: e.target.value }))}
            >
              <option value="">Seleccione obra</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre || o.codigo || `Obra #${o.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="select"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="accidente">Accidente</option>
              <option value="incidente">Incidente</option>
              <option value="condicion_insegura">Condición insegura</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Describe la novedad…"
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input w-full"
              max={maxFecha}
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
