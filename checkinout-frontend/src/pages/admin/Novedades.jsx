import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import FlashBanner from "../../components/FlashBanner";
import api from "../../api/axios";

const TAB_KEYS = ["Pendientes", "Novedades", "Todas"];

const TIPO_OPCIONES = [
  { value: "", label: "Todos" },
  { value: "accidente_laboral", label: "Accidente laboral" },
  { value: "permiso", label: "Permiso" },
  { value: "incapacidad", label: "Incapacidad" },
  { value: "ausencia_injustificada", label: "Ausencia injustificada" },
  { value: "otro", label: "Otro" },
];

function badgeEstadoNovedad(estado) {
  const e = String(estado || "").toLowerCase();
  if (e === "pendiente") return { bg: "#fef9c3", color: "#854d0e", label: estado };
  if (e === "aprobada") return { bg: "#dcfce7", color: "#15803d", label: estado };
  if (e === "rechazada") return { bg: "#fee2e2", color: "#991b1b", label: estado };
  return { bg: "#f1f5f9", color: "#475569", label: estado || "—" };
}

export default function NovedadesAdmin() {
  const [tab, setTab] = useState("Pendientes");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [motivosMap, setMotivosMap] = useState({});
  const [resolvingId, setResolvingId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const res = await api.get("/novedades");
      if (res.data?.ok === false) {
        setFlash({ type: "error", message: res.data.message || "Error al cargar novedades" });
        setRows([]);
        return;
      }
      const data = res.data?.data;
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setFlash({
        type: "error",
        message: err.response?.data?.message || err.message || "Error al cargar novedades",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtradasPorTab = useMemo(() => {
    if (tab === "Pendientes") {
      return rows.filter((n) => String(n.estado).toLowerCase() === "pendiente");
    }
    if (tab === "Novedades" || tab === "Todas") {
      return rows;
    }
    return rows;
  }, [rows, tab]);

  const displayRows = useMemo(() => {
    if (!tipoFiltro) return filtradasPorTab;
    return filtradasPorTab.filter((n) => String(n.tipo) === tipoFiltro);
  }, [filtradasPorTab, tipoFiltro]);

  const setMotivo = (id, valor) => {
    setMotivosMap((prev) => ({ ...prev, [id]: valor }));
  };

  const resolver = async (n, estado) => {
    const id = n.id;
    setResolvingId(id);
    setFlash(null);
    try {
      const { data } = await api.patch(`/novedades/${id}/resolver`, {
        estado,
        observacion_resolucion: motivosMap[id] ?? "",
      });
      if (data?.ok === false) {
        setFlash({ type: "error", message: data.message || "No se pudo resolver" });
        return;
      }
      setMotivosMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setFlash({
        type: "ok",
        message: estado === "aprobada" ? "Novedad aprobada" : "Novedad rechazada",
      });
      await cargar();
    } catch (err) {
      setFlash({
        type: "error",
        message: err.response?.data?.message || err.message || "Error al resolver",
      });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <>
      <TopBar title="Gestión de novedades" />
      <div className="p-6 space-y-4">
        {flash && (
          <FlashBanner
            type={flash.type === "error" ? "error" : "ok"}
            message={flash.message}
            onClose={() => setFlash(null)}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
          <div className="flex gap-4 border-b border-slate-200 flex-wrap">
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`pb-2 text-sm transition-colors ${
                  tab === key
                    ? "border-b-2 border-[#1565C0] text-[#1565C0] font-medium"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setTab(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 whitespace-nowrap">Tipo</label>
            <select
              className="select min-w-[200px]"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              {TIPO_OPCIONES.map((o) => (
                <option key={o.value || "todos"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 flex justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e2a4a]" />
          </div>
        ) : displayRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            No hay novedades para mostrar.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayRows.map((n) => {
              const st = badgeEstadoNovedad(n.estado);
              const pendiente = String(n.estado).toLowerCase() === "pendiente";
              return (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap gap-2 items-start justify-between">
                    <span
                      className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {n.tipo}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-slate-500">Trabajador: </span>
                      <span className="font-medium text-slate-800">{n.trabajador_nombre || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Obra: </span>
                      <span className="text-slate-800">{n.obra_nombre || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reportado por: </span>
                      <span className="text-slate-800">{n.reportado_por_nombre || "—"}</span>
                    </div>
                    {n.descripcion ? (
                      <p className="text-slate-600 text-xs pt-1 border-t border-slate-100">{n.descripcion}</p>
                    ) : null}
                  </div>

                  {pendiente ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        className="input w-full text-sm"
                        placeholder="Motivo de rechazo (opcional)"
                        value={motivosMap[n.id] ?? ""}
                        onChange={(e) => setMotivo(n.id, e.target.value)}
                        disabled={resolvingId === n.id}
                      />
                      <div className="flex flex-wrap gap-2">
                        {resolvingId === n.id ? (
                          <div className="flex w-full justify-center py-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#1e2a4a]" />
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn text-white text-sm flex-1 min-w-[100px]"
                              style={{ background: "#b91c1c" }}
                              onClick={() => resolver(n, "rechazada")}
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              className="btn text-white text-sm flex-1 min-w-[100px]"
                              style={{ background: "#15803d" }}
                              onClick={() => resolver(n, "aprobada")}
                            >
                              Aprobar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100">
                      <span
                        className="inline-flex w-full justify-center px-3 py-2 rounded-lg text-sm font-semibold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {String(n.estado || "").toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
