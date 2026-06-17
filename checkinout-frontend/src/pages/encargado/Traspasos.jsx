import { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle, ArrowLeftRight } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

const formatearFecha = (f) => {
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

const badgeEstado = (estado) => {
  const e = String(estado || "").toLowerCase();
  if (e === "aprobado") return "badge badge-success";
  if (e === "rechazado") return "badge badge-danger";
  return "badge badge-warning";
};

const etiquetaEstado = (e) => {
  const map = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
  return map[String(e || "").toLowerCase()] || e || "—";
};

export default function Traspasos() {
  const [traspasos, setTraspasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trabajadores, setTrabajadores] = useState([]);
  const [obras, setObras] = useState([]);
  const [form, setForm] = useState({
    trabajador_id: "",
    obra_origen_id: "",
    obra_destino_id: "",
    motivo: "",
    fecha_traspaso: "",
  });

  const cargar = async () => {
    const { data } = await api.get("/traspasos");
    const rows = data.data || data || [];
    setTraspasos(Array.isArray(rows) ? rows : []);
  };

  const abrirModal = () => {
    setForm({
      trabajador_id: "",
      obra_origen_id: "",
      obra_destino_id: "",
      motivo: "",
      fecha_traspaso: new Date().toISOString().slice(0, 10),
    });
    setOpenModal(true);
  };

  const onGuardar = async () => {
    const tid = String(form.trabajador_id).trim();
    const oid = String(form.obra_origen_id).trim();
    const did = String(form.obra_destino_id).trim();
    if (!tid || !oid || !did) {
      alert("Selecciona trabajador, obra de origen y obra de destino.");
      return;
    }
    if (oid === did) {
      alert("La obra de origen y la de destino no pueden ser la misma.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/traspasos", {
        trabajador_id: tid,
        obra_origen_id: oid,
        obra_destino_id: did,
        motivo: form.motivo?.trim() || undefined,
        fecha_traspaso: form.fecha_traspaso || undefined,
      });
      setOpenModal(false);
      await cargar();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo registrar el traspaso"
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
        const [trRes, tbRes, obRes] = await Promise.all([
          api.get("/traspasos"),
          api.get("/trabajadores"),
          api.get("/obras", { params: { todas: "1" } }),
        ]);
        if (!alive) return;
        const tr = trRes.data.data || trRes.data;
        const tb = tbRes.data.trabajadores || tbRes.data.data || tbRes.data;
        const ob = obRes.data.obras || obRes.data.data || obRes.data;
        setTraspasos(Array.isArray(tr) ? tr : []);
        setTrabajadores(Array.isArray(tb) ? tb : []);
        setObras(Array.isArray(ob) ? ob : []);
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || err.response?.data?.mensaje || err.message || "Error al cargar");
        setTraspasos([]);
        setTrabajadores([]);
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

  return (
    <>
      <TopBar
        title="Traspasos"
        subtitle="Movimientos entre obras"
        right={
          <button type="button" onClick={abrirModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Nuevo traspaso
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
        ) : traspasos.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Sin traspasos"
              message="No hay solicitudes de traspaso registradas."
              action={
                <button type="button" onClick={abrirModal} className="btn btn-primary">
                  <Plus className="w-4 h-4" /> Nuevo traspaso
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
                  <th>Trabajador</th>
                  <th>
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                      Movimiento
                    </span>
                  </th>
                  <th>Estado</th>
                  <th>Solicitado por</th>
                </tr>
              </thead>
              <tbody>
                {traspasos.map((tr) => (
                  <tr key={tr.id}>
                    <td className="text-slate-700 whitespace-nowrap">
                      {formatearFecha(tr.fecha_traspaso || tr.created_at)}
                    </td>
                    <td className="text-slate-700">
                      <div className="font-medium">{tr.trabajador || "—"}</div>
                      <div className="text-xs text-slate-500">{tr.cedula || ""}</div>
                    </td>
                    <td className="text-slate-600 max-w-xs">
                      <span className="text-slate-800">{tr.obra_origen || "—"}</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span className="text-slate-800">{tr.obra_destino || "—"}</span>
                    </td>
                    <td>
                      <span className={badgeEstado(tr.estado)}>{etiquetaEstado(tr.estado)}</span>
                    </td>
                    <td className="text-slate-600">{tr.solicitado_por_nombre || "—"}</td>
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
        title="Solicitar traspaso"
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
            <label className="label">Trabajador</label>
            <select
              className="select w-full"
              value={form.trabajador_id}
              onChange={(e) => setForm((f) => ({ ...f, trabajador_id: e.target.value }))}
            >
              <option value="">Seleccione trabajador</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {[t.nombre, t.apellido].filter(Boolean).join(" ") || "Sin nombre"} — {t.cedula || t.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Obra origen</label>
            <select
              className="select w-full"
              value={form.obra_origen_id}
              onChange={(e) => setForm((f) => ({ ...f, obra_origen_id: e.target.value }))}
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
            <label className="label">Obra destino</label>
            <select
              className="select w-full"
              value={form.obra_destino_id}
              onChange={(e) => setForm((f) => ({ ...f, obra_destino_id: e.target.value }))}
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
            <label className="label">Motivo (opcional)</label>
            <textarea
              className="textarea"
              rows={3}
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
              placeholder="Motivo del traspaso…"
            />
          </div>
          <div>
            <label className="label">Fecha del traspaso</label>
            <input
              type="date"
              className="input w-full"
              value={form.fecha_traspaso}
              onChange={(e) => setForm((f) => ({ ...f, fecha_traspaso: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
