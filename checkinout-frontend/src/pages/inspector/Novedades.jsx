import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, Pencil } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { normalizarListaObras, obtenerObraAsignada } from "../../utils/obraAsignada";

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

const etiquetaTipo = (t) => {
  const map = {
    accidente_laboral: "Accidente laboral",
    permiso: "Permiso",
    incapacidad: "Incapacidad",
    ausencia_injustificada: "Ausencia injustificada",
    otro: "Otro",
  };
  return map[t] || t || "—";
};

const etiquetaEstado = (e) => {
  const key = String(e || "").toLowerCase();
  const map = {
    abierta: "Abierta",
    en_gestion: "En gestión",
    cerrada: "Cerrada",
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
  };
  return map[key] || e || "—";
};

const badgeEstado = (estado) => {
  const e = String(estado || "").toLowerCase();
  if (e === "cerrada" || e === "aprobada") return "badge badge-success";
  if (e === "en_gestion") return "badge badge-warning";
  if (e === "rechazada") return "badge badge-muted";
  if (e === "pendiente" || e === "abierta") return "badge badge-danger";
  return "badge badge-muted";
};

const badgeTipo = (tipo) => {
  if (tipo === "accidente_laboral" || tipo === "ausencia_injustificada") return "badge badge-danger";
  if (tipo === "permiso") return "badge badge-warning";
  if (tipo === "incapacidad") return "badge badge-info";
  if (tipo === "otro") return "badge badge-muted";
  return "badge badge-muted";
};

const estadoFila = (n) => (n.estado_resolucion || n.estado || "").toLowerCase();

export default function Novedades() {
  const { usuario } = useAuth();
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [obras, setObras] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [tabActiva, setTabActiva] = useState("Pendientes");
  const [novedadEditando, setNovedadEditando] = useState(null);
  const [estadoGestion, setEstadoGestion] = useState("");
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [savingEditar, setSavingEditar] = useState(false);
  const [form, setForm] = useState({
    obra_id: "",
    trabajador_id: "",
    tipo: "accidente_laboral",
    descripcion: "",
    fecha: new Date().toISOString().slice(0, 10),
    soporte: null,
  });

  const cargar = async () => {
    const { data } = await api.get("/novedades");
    const rows = data.data || data || [];
    setNovedades(Array.isArray(rows) ? rows : []);
  };

  const novedadesFiltradas = useMemo(() => {
    if (tabActiva === "Todas") return novedades;
    return novedades.filter((n) => {
      const e = estadoFila(n);
      if (tabActiva === "Pendientes") return e === "pendiente" || e === "abierta";
      if (tabActiva === "Aprobadas") return e === "aprobada" || e === "cerrada";
      if (tabActiva === "Rechazadas") return e === "rechazada";
      return true;
    });
  }, [novedades, tabActiva]);

  const pendientesCount = useMemo(() => {
    return novedades.filter((n) => {
      const e = estadoFila(n);
      return e === "pendiente" || e === "abierta";
    }).length;
  }, [novedades]);

  const onGuardar = async () => {
    if (
      !String(form.obra_id).trim() ||
      !String(form.trabajador_id).trim() ||
      !form.tipo ||
      !String(form.descripcion).trim()
    ) {
      alert("Selecciona la obra, el trabajador, el tipo y escribe una descripción.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/novedades", {
        trabajador_id: form.trabajador_id,
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        fecha: form.fecha || undefined,
        obra_id: form.obra_id,
      });
      setForm({
        obra_id: "",
        trabajador_id: "",
        tipo: "accidente_laboral",
        descripcion: "",
        fecha: new Date().toISOString().slice(0, 10),
        soporte: null,
      });
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

  const abrirModalEditar = (n) => {
    setNovedadEditando(n);
    setEstadoGestion(n.estado || "abierta");
    setOpenModalEditar(true);
  };

  const guardarEdicion = async () => {
    if (!novedadEditando?.id) return;
    setSavingEditar(true);
    try {
      await api.patch(`/novedades/${novedadEditando.id}/estado`, { estado: estadoGestion });
      setOpenModalEditar(false);
      setNovedadEditando(null);
      await cargar();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data?.mensaje ||
          err.message ||
          "No se pudo actualizar el estado"
      );
    } finally {
      setSavingEditar(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const iniciar = async () => {
      setLoading(true);
      setError("");
      try {
        const [novRes, obrasRes] = await Promise.all([
          api.get("/novedades"),
          api.get("/obras"),
        ]);
        if (!alive) return;
        const nov = novRes.data.data || novRes.data;
        const obrasList = normalizarListaObras(obrasRes.data);
        const obraAsignada = obtenerObraAsignada(obrasList, usuario);
        const obs = obraAsignada ? [obraAsignada] : obrasList;

        let tb = [];
        if (obraAsignada?.id) {
          const trabRes = await api.get("/trabajadores", {
            params: { obra_id: obraAsignada.id, limit: 500 },
          });
          tb = trabRes.data?.data?.trabajadores ?? trabRes.data?.trabajadores ?? [];
        }

        setNovedades(Array.isArray(nov) ? nov : []);
        setObras(Array.isArray(obs) ? obs : []);
        setTrabajadores(Array.isArray(tb) ? tb : []);
        if (obraAsignada?.id) {
          setForm((f) => ({ ...f, obra_id: String(obraAsignada.id) }));
        }
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || err.response?.data?.mensaje || err.message || "Error al cargar");
        setNovedades([]);
        setObras([]);
        setTrabajadores([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    iniciar();
    return () => {
      alive = false;
    };
  }, [usuario?.id, usuario?.rol]);

  const maxFecha = new Date().toISOString().slice(0, 10);

  const resetForm = () => {
    setForm({
      obra_id: "",
      trabajador_id: "",
      tipo: "accidente_laboral",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 10),
      soporte: null,
    });
  };

  return (
    <>
      <TopBar title="Novedades" subtitle="Registro de incidentes y novedades en tu obra" />

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        ) : (
          <>
            <div className="flex border-b border-gray-200 mb-4">
              {["Pendientes", "Aprobadas", "Rechazadas", "Todas"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTabActiva(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tabActiva === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {pendientesCount > 0 && (tabActiva === "Pendientes" || tabActiva === "Todas") && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-2 mb-3 text-sm">
                {pendientesCount} Novedades pendientes de revisión por el administrador
              </div>
            )}

            {novedadesFiltradas.length === 0 ? (
              <div className="card">
                <EmptyState
                  title="Sin novedades"
                  message={
                    novedades.length === 0
                      ? "No hay novedades registradas en tu obra."
                      : "No hay novedades en esta pestaña."
                  }
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Trabajador</th>
                      <th>Tipo Novedad</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Editar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novedadesFiltradas.map((n, idx) => (
                      <tr key={n.id}>
                        <td className="text-slate-600">{idx + 1}</td>
                        <td className="text-slate-700">{n.trabajador_nombre || n.trabajador || "—"}</td>
                        <td>
                          <span className={badgeTipo(n.tipo)}>{etiquetaTipo(n.tipo)}</span>
                        </td>
                        <td className="text-slate-700 whitespace-nowrap">{formatearFechaTabla(n.fecha)}</td>
                        <td>
                          <span className={badgeEstado(n.estado_resolucion || n.estado)}>
                            {etiquetaEstado(n.estado_resolucion || n.estado)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(n)}
                            className="p-1 hover:bg-gray-100 rounded"
                            aria-label="Editar"
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card card-body mt-4">
              <h3 className="font-semibold text-gray-800 mb-4">Registrar novedad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="label">Tipo de Novedad</label>
                  <select
                    className="select w-full"
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  >
                    <option value="accidente_laboral">Accidente laboral</option>
                    <option value="permiso">Permiso</option>
                    <option value="incapacidad">Incapacidad</option>
                    <option value="ausencia_injustificada">Ausencia injustificada</option>
                    <option value="otro">Otro</option>
                  </select>
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
                <div className="md:col-span-2">
                  <label className="label">Descripción</label>
                  <textarea
                    className="textarea w-full"
                    rows={3}
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe la novedad…"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Adjuntar soporte</label>
                  <input
                    type="file"
                    className="input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setForm((f) => ({ ...f, soporte: e.target.files?.[0] ?? null }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void onGuardar()}
                  disabled={saving}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Novedad
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={openModalEditar}
        onClose={() => {
          setOpenModalEditar(false);
          setNovedadEditando(null);
        }}
        title="Editar Novedad"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setOpenModalEditar(false);
                setNovedadEditando(null);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary inline-flex items-center gap-2"
              disabled={savingEditar}
              onClick={() => void guardarEdicion()}
            >
              {savingEditar && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        {novedadEditando && (
          <div className="space-y-4">
            <div>
              <label className="label">Trabajador</label>
              <input
                type="text"
                className="input w-full bg-gray-50"
                readOnly
                value={novedadEditando.trabajador_nombre || novedadEditando.trabajador || "—"}
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <input
                type="text"
                className="input w-full bg-gray-50"
                readOnly
                value={etiquetaTipo(novedadEditando.tipo)}
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="text"
                className="input w-full bg-gray-50"
                readOnly
                value={formatearFechaTabla(novedadEditando.fecha)}
              />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="textarea w-full bg-gray-50" rows={4} readOnly value={novedadEditando.descripcion || ""} />
            </div>
            <div>
              <label className="label">Estado gestión</label>
              <select
                className="select w-full"
                value={estadoGestion}
                onChange={(e) => setEstadoGestion(e.target.value)}
              >
                <option value="abierta">Abierta</option>
                <option value="en_gestion">En gestión</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
