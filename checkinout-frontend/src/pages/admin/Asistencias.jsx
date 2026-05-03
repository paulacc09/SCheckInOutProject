import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, Calendar, Building2, Filter, Percent, Users } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

const normMsg = (err) =>
  err.response?.data?.message || err.response?.data?.mensaje || "Algo salió mal";

export default function Asistencias() {
  const [registros, setRegistros] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [obraId, setObraId] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [registroEstado, setRegistroEstado] = useState("");

  const [resumen, setResumen] = useState({
    porcentaje_asistencia: 0,
    asistentes: 0,
    trabajadores_activos: 0,
    esperados: 0,
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: body } = await api.get("/obras");
        if (cancel) return;
        const list = body?.data ?? body?.obras ?? [];
        setObras(Array.isArray(list) ? list : []);
      } catch {
        if (!cancel) setObras([]);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const cargarResumen = useCallback(async () => {
    try {
      const { data: body } = await api.get("/asistencia/resumen", {
        params: { fecha, obra_id: obraId || undefined },
      });
      const stats = body?.data ?? {};
      const pct = Number(stats.porcentaje_asistencia);
      const asistentesNum = Number(stats.asistentes);
      const esperadosNum = Number(stats.esperados);
      const activosNum = Number(stats.trabajadores_activos ?? stats.esperados);
      setResumen({
        porcentaje_asistencia: Number.isFinite(pct) ? pct : 0,
        asistentes: Number.isFinite(asistentesNum) ? asistentesNum : 0,
        trabajadores_activos: Number.isFinite(activosNum) ? activosNum : 0,
        esperados: Number.isFinite(esperadosNum) ? esperadosNum : 0,
      });
    } catch {
      setResumen({
        porcentaje_asistencia: 0,
        asistentes: 0,
        trabajadores_activos: 0,
        esperados: 0,
      });
    }
  }, [fecha, obraId]);

  const cargarRegistros = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        fecha,
        ...(obraId ? { obra_id: obraId } : {}),
        ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
        ...(registroEstado ? { registro_estado: registroEstado } : {}),
      };
      await cargarResumen();
      const { data: regBody } = await api.get("/asistencia/registros", { params });
      const lista = regBody?.data ?? regBody?.registros ?? [];
      setRegistros(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setError(normMsg(err) || "No se pudo cargar la asistencia");
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [fecha, obraId, tipoFiltro, registroEstado, cargarResumen]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  return (
    <>
      <TopBar title="Asistencias" subtitle="Consulta los registros de ingreso y salida" />
      <div className="p-6 space-y-4">
        <div className="card card-body flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Filter className="w-4 h-4" /> Filtros
          </div>
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 items-start lg:items-end">
            <div>
              <label className="label">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  className="input pl-9 min-w-[12rem]"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Obra</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  className="select pl-9 min-w-[14rem]"
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                >
                  <option value="">Todas las obras</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tipo registro</label>
              <select
                className="select sm:w-40"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingreso</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="select sm:w-40"
                value={registroEstado}
                onChange={(e) => setRegistroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="valido">Válido</option>
                <option value="duplicado">Duplicado</option>
                <option value="invalido">Inválido</option>
              </select>
            </div>
          </div>

          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  <Percent className="w-4 h-4 text-primary shrink-0" /> Asistencia del día
                </div>
                <div className="text-3xl font-bold text-slate-800 tabular-nums">
                  {resumen.esperados > 0 ? `${resumen.porcentaje_asistencia}%` : "—"}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Asistentes: <span className="font-semibold">{resumen.asistentes}</span>
                  {" · "}
                  Esperados: <span className="font-semibold">{resumen.esperados}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  <Users className="w-4 h-4 text-primary shrink-0" /> Activos ({obraId ? "en la obra seleccionada" : "empresa"})
                </div>
                <div className="text-3xl font-bold text-slate-800 tabular-nums">
                  {resumen.trabajadores_activos}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Personal activo en plantilla conforme al filtro de obra.
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : registros.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Sin registros"
              message="No hay asistencias que coincidan con los filtros seleccionados."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Cédula</th>
                  <th>Obra</th>
                  <th>Tipo</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">
                      {r.trabajador || `${r.nombre || ""} ${r.apellido || ""}`.trim() || "—"}
                    </td>
                    <td className="font-mono text-xs">{r.cedula}</td>
                    <td>{r.obra_nombre || r.obra || "—"}</td>
                    <td>
                      <span className={r.tipo === "ingreso" ? "badge badge-info" : "badge badge-muted"}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="font-mono text-xs">
                      {r.timestamp ? new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td>
                      <span className={
                        r.estado === "valido" ? "badge badge-success"
                          : r.estado === "duplicado" ? "badge badge-warning"
                            : "badge badge-danger"
                      }>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
