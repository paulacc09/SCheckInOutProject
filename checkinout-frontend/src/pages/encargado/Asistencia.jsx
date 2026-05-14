import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
import PaginationBar from "../../components/PaginationBar";
import CamaraFacial from "../../components/CamaraFacial";
import { useAuth } from "../../context/AuthContext";
import { paginate } from "../../services/pagination";

const PAGE_SIZE = 10;

const hoyISO = () => new Date().toISOString().slice(0, 10);

const horaCorta = (d) =>
  new Date(d).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const nombreResponsable = (jornada, usuario) => {
  if (!jornada) return null;
  if (jornada.responsable) return jornada.responsable;
  const n = [jornada.inspector_nombre, jornada.inspector_apellido].filter(Boolean).join(" ").trim();
  if (n) return n;
  return usuario?.nombre ? `${usuario.nombre} ${usuario.apellido ?? ""}`.trim() : "";
};

const etiquetaEstadoPersonal = (estado) => {
  if (estado === "Ausente") return { label: "Ausente", cls: "bg-red-400 text-white rounded px-2 py-0.5 text-xs" };
  return { label: "Presente", cls: "bg-green-500 text-white rounded px-2 py-0.5 text-xs" };
};

export default function Asistencia() {
  const { usuario } = useAuth();
  const [obra, setObra] = useState(null);
  const [jornada, setJornada] = useState(null);
  const [resumenRows, setResumenRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cedula, setCedula] = useState("");
  const [marcando, setMarcando] = useState(false);
  const [mensajeMarcaje, setMensajeMarcaje] = useState(null);
  const [errorJornada, setErrorJornada] = useState("");
  const [mostrarBiometrico, setMostrarBiometrico] = useState(false);
  const [page, setPage] = useState(1);

  const cargarResumen = useCallback(async (obraId) => {
    if (!obraId) {
      setResumenRows([]);
      return [];
    }
    const { data } = await api.get("/asistencia/resumen-trabajadores", {
      params: { obra_id: obraId, fecha: hoyISO() },
    });
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    setResumenRows(rows);
    return rows;
  }, []);

  const refrescarJornada = useCallback(async (obraId) => {
    if (!obraId) return null;
    const { data: bodyJornadas } = await api.get("/asistencia/jornadas", {
      params: { obra_id: obraId },
    });
    const rawJ = bodyJornadas?.data ?? bodyJornadas?.obras ?? bodyJornadas;
    const jornadasList = Array.isArray(rawJ) ? rawJ : [];
    const abierta = jornadasList.find((j) => j.estado === "abierta") ?? null;
    setJornada(abierta);
    return abierta;
  }, []);

  useEffect(() => {
    let alive = true;

    const iniciar = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: bodyObras } = await api.get("/obras");
        const rawObras = bodyObras?.data ?? bodyObras?.obras ?? bodyObras;
        const obrasList = Array.isArray(rawObras) ? rawObras : [];
        const primera = obrasList[0] ?? null;
        if (!alive) return;
        setObra(primera);

        if (!primera) {
          setJornada(null);
          setResumenRows([]);
          return;
        }

        await refrescarJornada(primera.id);
        if (!alive) return;
        await cargarResumen(primera.id);
      } catch (err) {
        if (!alive) return;
        setError(
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo cargar la asistencia"
        );
        setObra(null);
        setJornada(null);
        setResumenRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    iniciar();
    return () => {
      alive = false;
    };
  }, [cargarResumen, refrescarJornada]);

  useEffect(() => {
    if (!obra?.id) return undefined;
    const id = window.setInterval(() => {
      void cargarResumen(obra.id);
    }, 30000);
    return () => window.clearInterval(id);
  }, [obra?.id, cargarResumen]);

  useEffect(() => {
    if (!mensajeMarcaje) return undefined;
    const t = window.setTimeout(() => setMensajeMarcaje(null), 3000);
    return () => clearTimeout(t);
  }, [mensajeMarcaje]);

  useEffect(() => {
    setPage(1);
  }, [obra?.id]);

  const abrirJornada = async () => {
    if (!obra?.id) return;
    setErrorJornada("");
    try {
      await api.post("/asistencia/jornada/abrir", { obra_id: obra.id });
      await refrescarJornada(obra.id);
      await cargarResumen(obra.id);
    } catch (err) {
      setErrorJornada(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo abrir la jornada"
      );
    }
  };

  const cerrarJornada = async () => {
    if (!jornada?.id) return;
    if (!window.confirm("¿Cerrar la jornada?")) return;
    setErrorJornada("");
    try {
      await api.patch(`/asistencia/jornada/${jornada.id}/cerrar`);
      setJornada(null);
      await cargarResumen(obra.id);
    } catch (err) {
      setErrorJornada(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo cerrar la jornada"
      );
    }
  };

  const armarMensajeExito = (nombreTrabajador, ts, obraNombre) => {
    const hora = horaCorta(ts);
    return `${nombreTrabajador} - ${hora} - ${obraNombre}`;
  };

  const registrarMarcaje = async (tipo) => {
    if (!cedula.trim()) {
      setMensajeMarcaje({ tipo: "error", texto: "Ingresa el documento del trabajador." });
      return;
    }
    if (!obra?.id) return;

    const doc = cedula.trim();
    setMarcando(true);
    try {
      const { data: body } = await api.post("/asistencia/registrar", {
        cedula: doc,
        tipo,
        obra_id: obra.id,
        metodo: "cedula",
      });
      const respuesta = body?.data ?? body;
      const ts = respuesta?.timestamp ?? new Date().toISOString();
      const rows = await cargarResumen(obra.id);
      const match = rows.find((r) => String(r.cedula) === String(doc));
      const nombreTrab = match?.nombre || doc;
      setMensajeMarcaje({
        tipo: "success",
        texto: armarMensajeExito(nombreTrab, ts, obra.nombre),
      });
      setCedula("");
    } catch (err) {
      setMensajeMarcaje({
        tipo: "error",
        texto:
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "Error al registrar",
      });
    } finally {
      setMarcando(false);
    }
  };

  const handleBiometrico = async (trabajador) => {
    if (!obra?.id) return;
    const { data: body } = await api.post("/asistencia/registrar", {
      cedula: trabajador.cedula,
      tipo: "ingreso",
      obra_id: obra.id,
      metodo: "facial",
    });
    const respuesta = body?.data ?? body;
    const ts = respuesta?.timestamp ?? new Date().toISOString();
    await cargarResumen(obra.id);
    const nombreTrab = [trabajador.nombre, trabajador.apellido].filter(Boolean).join(" ") || trabajador.cedula;
    setMensajeMarcaje({
      tipo: "success",
      texto: armarMensajeExito(nombreTrab, ts, obra.nombre),
    });
  };

  const onMatchDescriptor = async (descriptor) => {
    if (!obra?.id) return;
    try {
      const { data: res } = await api.post("/trabajadores/identificar-rostro", { descriptor });
      const inner = res?.data ?? res;
      const trabajador = inner?.trabajador;
      if (!trabajador?.cedula) {
        setMensajeMarcaje({ tipo: "error", texto: "No se reconoció al trabajador." });
        return;
      }
      await handleBiometrico(trabajador);
    } catch (err) {
      setMensajeMarcaje({
        tipo: "error",
        texto:
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "Error en registro biométrico",
      });
    } finally {
      setMostrarBiometrico(false);
    }
  };

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(resumenRows, page, PAGE_SIZE),
    [resumenRows, page]
  );

  const horaJornada = jornada?.hora_apertura ? horaCorta(jornada.hora_apertura) : null;
  const responsableTxt = nombreResponsable(jornada, usuario);

  return (
    <>
      <TopBar title="CHECKINOUT - ENCARGADO" subtitle="Control de jornada y asistencia" />

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
              title="Sin obra asignada"
              message="No tienes una obra asignada. Contacta al administrador."
            />
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 text-right mb-1">
              No posee permiso de administración para hacer cambios en esta pestaña
            </p>
            <div className="bg-[#1e3a5f] text-white rounded-xl px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-widest opacity-70">OBRA ACTIVA</p>
                <p className="text-xl font-bold">{obra.nombre || "—"}</p>
                <p className="text-sm opacity-90">
                  {jornada && horaJornada
                    ? `Jornada iniciada hoy ${horaJornada} - Responsable: ${responsableTxt || usuario?.nombre || "—"}`
                    : "Sin jornada activa"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {errorJornada && <p className="w-full text-sm text-amber-200 md:text-right">{errorJornada}</p>}
                {jornada ? (
                  <button
                    type="button"
                    className="border border-white text-white bg-transparent rounded px-4 py-1.5 text-sm"
                    disabled
                  >
                    Jornada abierta
                  </button>
                ) : (
                  <button
                    type="button"
                    className="border border-white text-white bg-transparent rounded px-4 py-1.5 text-sm"
                    onClick={abrirJornada}
                  >
                    Abrir jornada
                  </button>
                )}
                {jornada && (
                  <button
                    type="button"
                    className="bg-[#2d1b4e] text-white rounded px-4 py-1.5 text-sm"
                    onClick={cerrarJornada}
                  >
                    Cerrar jornada
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="card card-body space-y-4">
                <h3 className="font-semibold text-slate-800">Registrar asistencia</h3>
                <div>
                  <label className="label">Nº Documento trabajador</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary flex-1"
                    disabled={marcando}
                    onClick={() => registrarMarcaje("ingreso")}
                  >
                    Registrar Ingreso
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline flex-1"
                    disabled={marcando}
                    onClick={() => registrarMarcaje("salida")}
                  >
                    Registrar salida
                  </button>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <hr className="flex-1" />
                  <span className="text-xs text-gray-400">Biometría</span>
                  <hr className="flex-1" />
                </div>
                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={() => setMostrarBiometrico(true)}
                >
                  Registrar biométrico
                </button>
                {mostrarBiometrico && (
                  <CamaraFacial
                    modo="identificar"
                    onMatch={onMatchDescriptor}
                    onClose={() => setMostrarBiometrico(false)}
                  />
                )}
                {mensajeMarcaje !== null && (
                  <div
                    className={
                      mensajeMarcaje.tipo === "success"
                        ? "bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-3 text-sm"
                        : "bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm"
                    }
                  >
                    {mensajeMarcaje.texto}
                  </div>
                )}
              </div>

              <div className="card card-body space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">Personal en Obra</h3>
                  <span className="bg-gray-200 text-gray-700 rounded px-2 text-sm">{resumenRows.length}</span>
                </div>
                {resumenRows.length === 0 ? (
                  <EmptyState title="Sin datos" message="No hay trabajadores en el resumen para hoy." />
                ) : (
                  <>
                    <div className="table-wrap rounded-none border-0">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Trabajador</th>
                            <th>Documento</th>
                            <th>Ingreso</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((r, idx) => {
                            const { label, cls } = etiquetaEstadoPersonal(r.estado);
                            return (
                              <tr key={`${r.trabajador_id}-${r.cedula}-${idx}`}>
                                <td className="text-slate-800">{r.nombre ?? "—"}</td>
                                <td className="font-mono text-xs">{r.cedula ?? "—"}</td>
                                <td className="text-slate-700">{r.hora_ingreso ?? "—"}</td>
                                <td>
                                  <span className={cls}>{label}</span>
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
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
