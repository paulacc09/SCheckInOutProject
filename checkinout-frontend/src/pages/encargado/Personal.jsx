import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Loader2, AlertCircle, Pencil } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
import PaginationBar from "../../components/PaginationBar";
import { useAuth } from "../../context/AuthContext";
import { paginate } from "../../services/pagination";
import { horaCorta } from "../../utils/formatHora";
import { normalizarListaObras, obtenerObraAsignada } from "../../utils/obraAsignada";

const PAGE_SIZE = 10;
const hoyISO = () => new Date().toISOString().slice(0, 10);

const unwrap = (body) => body?.data ?? body?.obras ?? body?.trabajadores ?? body;

const nombreResponsableJornada = (j, usuario) => {
  if (!j) return "";
  const n = [j.inspector_nombre, j.inspector_apellido].filter(Boolean).join(" ").trim();
  if (n) return n;
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ").trim() || usuario?.nombre || "";
};

const UMBRAL_TARDANZA_MIN = 8 * 60 + 30;

function minutosDesdeHora(horaStr) {
  const p = String(horaStr || "").split(":");
  const h = parseInt(p[0], 10);
  const m = parseInt(p[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function estadoDiaDesdeResumen(r) {
  if (!r) return "Ausente";
  const api = String(r.estado || "").trim();
  if (api === "Ausente") return "Ausente";
  if (api === "Salida") return "Activo";
  if (api === "Activo") {
    const mins = minutosDesdeHora(r.hora_ingreso);
    if (mins != null && mins > UMBRAL_TARDANZA_MIN) return "Tardanza";
    return "Presente";
  }
  return "Ausente";
}

function badgeEstadoDia(estado) {
  const base = "rounded-full px-3 py-0.5 text-xs font-medium";
  if (estado === "Presente") return { label: "Presente", cls: `${base} bg-green-500 text-white` };
  if (estado === "Ausente") return { label: "Ausente", cls: `${base} bg-red-500 text-white` };
  if (estado === "Tardanza") return { label: "Tardanza", cls: `${base} bg-yellow-400 text-yellow-900` };
  if (estado === "Activo") return { label: "Activo", cls: `${base} bg-blue-500 text-white` };
  return { label: estado || "—", cls: `${base} bg-slate-300 text-slate-800` };
}

export default function Personal() {
  const { usuario } = useAuth();

  const [obra, setObra] = useState(null);
  const [jornada, setJornada] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [resumenRows, setResumenRows] = useState([]);
  const [subcargos, setSubcargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cargoFiltro, setCargoFiltro] = useState("");
  const [page, setPage] = useState(1);

  const fecha = hoyISO();

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: obrasBody }, subRes] = await Promise.all([
        api.get("/obras"),
        api.get("/subcargos"),
      ]);
      const obrasList = normalizarListaObras(obrasBody);
      const obraAsignada = obtenerObraAsignada(obrasList, usuario);
      setObra(obraAsignada);

      const subRaw = unwrap(subRes.data);
      setSubcargos(Array.isArray(subRaw) ? subRaw : []);

      if (!obraAsignada?.id) {
        setTrabajadores([]);
        setResumenRows([]);
        setJornada(null);
        return;
      }

      const [{ data: trabBody }, { data: resumenBody }, { data: jornBody }] = await Promise.all([
        api.get("/trabajadores", { params: { obra_id: obraAsignada.id, limit: 500 } }),
        api.get("/asistencia/resumen-trabajadores", {
          params: { obra_id: obraAsignada.id, fecha },
        }),
        api.get("/asistencia/jornadas", { params: { obra_id: obraAsignada.id } }),
      ]);

      const rawTrab = unwrap(trabBody);
      const trabList = Array.isArray(rawTrab?.trabajadores)
        ? rawTrab.trabajadores
        : Array.isArray(rawTrab)
          ? rawTrab
          : [];
      setTrabajadores(trabList);

      const resList = Array.isArray(unwrap(resumenBody)) ? unwrap(resumenBody) : [];
      const resHoy = resList.filter((r) => String(r.fecha || "").slice(0, 10) === fecha);
      setResumenRows(resHoy);

      const jList = Array.isArray(unwrap(jornBody)) ? unwrap(jornBody) : [];
      setJornada(jList.find((j) => j.estado === "abierta") ?? null);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || "No se pudo cargar el personal");
      setObra(null);
      setTrabajadores([]);
      setResumenRows([]);
      setJornada(null);
    } finally {
      setLoading(false);
    }
  }, [fecha, usuario]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const resumenPorTrabajador = useMemo(() => {
    const map = new Map();
    for (const r of resumenRows) {
      if (r.trabajador_id != null) map.set(String(r.trabajador_id), r);
      const c = r.cedula != null ? String(r.cedula).trim() : "";
      if (c) map.set(`ced:${c}`, r);
    }
    return map;
  }, [resumenRows]);

  const filas = useMemo(() => {
    return trabajadores.map((t) => {
      const idStr = String(t.id);
      const ced = String(t.cedula || "").trim();
      const res =
        resumenPorTrabajador.get(idStr) ?? (ced ? resumenPorTrabajador.get(`ced:${ced}`) : undefined);
      const estado_dia = estadoDiaDesdeResumen(res);
      const hora_ingreso = res?.hora_ingreso ? horaCorta(res.hora_ingreso) : "--";
      const cargoLabel = t.subcargo || t.subcargo_nombre || t.cargo || "—";
      return {
        trabajador_id: t.id,
        nombre: [t.nombre, t.apellido].filter(Boolean).join(" ").trim() || "—",
        cedula: t.cedula,
        cargo: cargoLabel,
        hora_ingreso,
        estado_dia,
      };
    });
  }, [trabajadores, resumenPorTrabajador]);

  const stats = useMemo(() => {
    const total = filas.length;
    const ausentes = filas.filter((f) => f.estado_dia === "Ausente").length;
    const presentes = total - ausentes;
    return { presentes, ausentes, total };
  }, [filas]);

  const filtrados = useMemo(() => {
    const txt = q.trim().toLowerCase();
    return filas.filter((f) => {
      const okQ =
        !txt ||
        f.nombre.toLowerCase().includes(txt) ||
        String(f.cedula || "")
          .toLowerCase()
          .includes(txt);
      const okEstado = !estadoFiltro || f.estado_dia === estadoFiltro;
      const okCargo = !cargoFiltro || f.cargo === cargoFiltro;
      return okQ && okEstado && okCargo;
    });
  }, [filas, q, estadoFiltro, cargoFiltro]);

  useEffect(() => {
    setPage(1);
  }, [q, estadoFiltro, cargoFiltro, obra?.id]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(filtrados, page, PAGE_SIZE),
    [filtrados, page]
  );

  const horaJornada = jornada?.hora_apertura ? horaCorta(jornada.hora_apertura) : null;
  const responsable = nombreResponsableJornada(jornada, usuario);

  return (
    <>
      <TopBar title="Personal en Obra" subtitle="Trabajadores asignados a tu obra" />

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        ) : !obra ? (
          <div className="card">
            <EmptyState
              title="Sin obra"
              message="No tienes una obra asignada. Contacta al administrador."
            />
          </div>
        ) : (
          <>
            <div className="bg-[#1e3a5f] text-white rounded-xl px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-semibold tracking-widest opacity-70">OBRA ACTIVA</p>
                <p className="text-xl font-bold truncate">{obra.nombre || "—"}</p>
                <p className="text-sm opacity-90">{obra.ciudad || "—"}</p>
                <p className="text-sm opacity-90">
                  {jornada && horaJornada
                    ? `Jornada iniciada hoy ${horaJornada} - Responsable: ${responsable || "—"}`
                    : "Sin jornada activa"}
                </p>
              </div>
              <div className="flex flex-wrap gap-6 lg:gap-10 shrink-0">
                <div className="text-center">
                  <p className="text-3xl font-bold leading-tight">{stats.presentes}</p>
                  <p className="text-xs uppercase tracking-wide opacity-80">Presentes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold leading-tight">{stats.ausentes}</p>
                  <p className="text-xs uppercase tracking-wide opacity-80">Ausentes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold leading-tight">{stats.total}</p>
                  <p className="text-xs uppercase tracking-wide opacity-80">Asignados</p>
                </div>
              </div>
            </div>

            <div className="card card-body flex flex-col lg:flex-row flex-wrap gap-3 items-stretch lg:items-end">
              <div className="relative flex-1 min-w-[12rem]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input pl-9 bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="Buscar…"
                  disabled
                />
              </div>
              <select
                className="select sm:w-44"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Presente">Presente</option>
                <option value="Ausente">Ausente</option>
                <option value="Tardanza">Tardanza</option>
                <option value="Activo">Activo</option>
              </select>
              <select
                className="select sm:w-48"
                value={cargoFiltro}
                onChange={(e) => setCargoFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                {subcargos.map((s) => (
                  <option key={s.id} value={s.nombre}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <span className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-1 lg:ml-auto self-center">
                Solo lectura - no puede agregar/eliminar
              </span>
            </div>

            {filtrados.length === 0 ? (
              <div className="card">
                <EmptyState title="Sin personal" message="No hay trabajadores que coincidan con los filtros." />
              </div>
            ) : (
              <>
                <div className="table-wrap card overflow-hidden">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Cargo</th>
                        <th>Hora Ingreso</th>
                        <th>Estado</th>
                        <th>Editar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, idx) => {
                        const { label, cls } = badgeEstadoDia(row.estado_dia);
                        const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;
                        return (
                          <tr key={row.trabajador_id}>
                            <td className="text-slate-600">{rowNum}</td>
                            <td>
                              <span className="font-medium text-slate-800 underline cursor-pointer opacity-60">
                                {row.nombre}
                              </span>
                            </td>
                            <td className="font-mono text-xs">{row.cedula ?? "—"}</td>
                            <td className="text-slate-600">{row.cargo}</td>
                            <td className="text-slate-700">{row.hora_ingreso}</td>
                            <td>
                              <span className={cls}>{label}</span>
                            </td>
                            <td>
                              <span className="inline-flex p-1 opacity-40 cursor-not-allowed" aria-hidden>
                                <Pencil className="w-4 h-4 text-slate-600" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
