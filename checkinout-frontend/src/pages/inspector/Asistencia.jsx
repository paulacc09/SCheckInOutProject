import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const BADGE_AUSENTE = { label: "Ausente", cls: "bg-red-400 text-white rounded px-2 py-0.5 text-xs" };
const BADGE_PRESENTE = { label: "Presente", cls: "bg-green-500 text-white rounded px-2 py-0.5 text-xs" };

function horaCampoDefinido(v) {
  if (v == null) return false;
  if (typeof v === "string") {
    const s = v.trim();
    return s.length > 0 && s !== "null";
  }
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  return true;
}

/** Mapea fila de GET /asistencia/resumen-trabajadores al badge de Estado. */
function etiquetaEstadoResumen(r) {
  const tipo = String(r?.tipo ?? "").toLowerCase();
  const estado = String(r?.estado ?? "").toLowerCase();

  const esSalida =
    tipo === "salida" || estado === "salida" || horaCampoDefinido(r?.hora_salida);

  const esPresente =
    tipo === "ingreso" || estado === "presente" || estado === "activo";

  if (esSalida) return BADGE_AUSENTE;
  if (esPresente) return BADGE_PRESENTE;
  return BADGE_AUSENTE;
}

function tieneDescriptorFacial(t) {
  const d = t?.descriptor_facial ?? t?.descriptor;
  if (d == null) return false;
  if (typeof d === "string") return d.trim().length > 0;
  return Array.isArray(d) && d.length > 0;
}

function descriptorParaCamara(t) {
  return t?.descriptor_facial ?? t?.descriptor ?? null;
}

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
  const [pendienteRegistro, setPendienteRegistro] = useState(null);
  const [modoCamara, setModoCamara] = useState(null);
  const [trabajadorActual, setTrabajadorActual] = useState(null);
  const [page, setPage] = useState(1);
  const pendRef = useRef(null);
  const trabRef = useRef(null);
  const modoCamaraRef = useRef(null);

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
    // Temporal: ver en consola del navegador la forma real de cada fila (campos del backend).
    console.log("[asistencia/resumen-trabajadores] resumenRows", rows);
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

  useEffect(() => {
    modoCamaraRef.current = modoCamara;
  }, [modoCamara]);

  useEffect(() => {
    pendRef.current = pendienteRegistro;
  }, [pendienteRegistro]);

  useEffect(() => {
    trabRef.current = trabajadorActual;
  }, [trabajadorActual]);

  const abrirJornada = async () => {
    if (!obra?.id) return;
    setErrorJornada("");
    try {
      await api.post("/asistencia/jornada/abrir", { obra_id: obra.id });
      await refrescarJornada(obra.id);
      await cargarResumen(obra?.id);
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
      await cargarResumen(obra?.id);
    } catch (err) {
      setErrorJornada(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo cerrar la jornada"
      );
    }
  };

  const buscarTrabajadorPorCedula = async (doc) => {
    const { data } = await api.get(`/trabajadores/cedula/${encodeURIComponent(doc)}`);
    return data?.data ?? null;
  };

  const completarRegistro = async (ced, tipo, metodo) => {
    if (!obra?.id) return;
    const { data: body } = await api.post("/asistencia/registrar", {
      cedula: ced,
      tipo,
      obra_id: obra.id,
      metodo,
    });
    const respuesta = body?.data ?? body;
    const horaStr = new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setMensajeMarcaje({
      tipo: "success",
      texto: `${respuesta?.trabajador ?? ced} - ${horaStr} - ${obra.nombre}`,
    });
    setCedula("");
    setPendienteRegistro(null);
    pendRef.current = null;
    setTrabajadorActual(null);
    trabRef.current = null;
    await cargarResumen(obra.id);
  };

  const iniciarRegistro = async (tipo) => {
    const docRaw = cedula.trim();
    if (!docRaw) {
      setMensajeMarcaje({ tipo: "error", texto: "Ingresa el documento" });
      return;
    }
    if (!obra?.id) return;
    setMarcando(true);
    try {
      let trab;
      try {
        trab = await buscarTrabajadorPorCedula(docRaw);
      } catch (err) {
        if (err.response?.status === 404) {
          setMensajeMarcaje({ tipo: "error", texto: "Trabajador no encontrado" });
          return;
        }
        throw err;
      }
      if (!trab) {
        setMensajeMarcaje({ tipo: "error", texto: "Trabajador no encontrado" });
        return;
      }
      setTrabajadorActual(trab);
      trabRef.current = trab;
      if (tieneDescriptorFacial(trab)) {
        const pend = { cedula: docRaw, tipo };
        setPendienteRegistro(pend);
        pendRef.current = pend;
        setModoCamara("verificar");
        modoCamaraRef.current = "verificar";
        setMostrarBiometrico(true);
      } else {
        await completarRegistro(docRaw, tipo, "cedula");
      }
    } catch (err) {
      setMensajeMarcaje({
        tipo: "error",
        texto:
          err.response?.data?.message ||
            err.response?.data?.mensaje ||
            "Error al buscar trabajador",
      });
    } finally {
      setMarcando(false);
    }
  };

  const handleBiometricoVerify = async () => {
    const pend = pendRef.current;
    setMostrarBiometrico(false);
    setModoCamara(null);
    modoCamaraRef.current = null;
    pendRef.current = null;
    setPendienteRegistro(null);
    if (!pend || !obra?.id) return;
    try {
      await completarRegistro(pend.cedula, pend.tipo, "facial");
    } catch (err) {
      setMensajeMarcaje({
        tipo: "error",
        texto:
          err.response?.data?.message || err.response?.data?.mensaje || "Error al registrar",
      });
    }
  };

  const handleBiometricoRegistrar = async (descriptor) => {
    const trab = trabRef.current ?? trabajadorActual;
    if (!trab?.id) return;
    const nombre = [trab.nombre, trab.apellido].filter(Boolean).join(" ").trim() || trab.cedula;
    try {
      await api.patch(`/trabajadores/${trab.id}/descriptor`, { descriptor });
      setMensajeMarcaje({
        tipo: "success",
        texto: `Biométrico registrado correctamente para ${nombre}`,
      });
    } catch (err) {
      setMensajeMarcaje({ tipo: "error", texto: "No se pudo guardar el biométrico" });
    } finally {
      setMostrarBiometrico(false);
      setModoCamara(null);
      modoCamaraRef.current = null;
    }
  };

  const cerrarCamaraFacial = () => {
    const m = modoCamaraRef.current;
    const p = pendRef.current;
    setMostrarBiometrico(false);
    setModoCamara(null);
    modoCamaraRef.current = null;
    if (m === "verificar" && p) {
      setMensajeMarcaje({ tipo: "error", texto: "No se pudo verificar identidad biométrica" });
    }
    setPendienteRegistro(null);
    pendRef.current = null;
    if (m === "verificar") {
      setTrabajadorActual(null);
      trabRef.current = null;
    }
  };

  const abrirRegistrarBiometrico = async () => {
    const docRaw = cedula.trim();
    if (!docRaw) {
      setMensajeMarcaje({ tipo: "error", texto: "Ingresa el documento primero" });
      return;
    }
    try {
      let trab;
      try {
        trab = await buscarTrabajadorPorCedula(docRaw);
      } catch (err) {
        if (err.response?.status === 404) {
          setMensajeMarcaje({ tipo: "error", texto: "Trabajador no encontrado" });
          return;
        }
        throw err;
      }
      if (!trab) {
        setMensajeMarcaje({ tipo: "error", texto: "Trabajador no encontrado" });
        return;
      }
      if (tieneDescriptorFacial(trab)) {
        setMensajeMarcaje({
          tipo: "error",
          texto: "Este trabajador ya tiene un biométrico registrado.",
        });
        return;
      }
      setTrabajadorActual(trab);
      trabRef.current = trab;
      setModoCamara("registrar");
      modoCamaraRef.current = "registrar";
      setMostrarBiometrico(true);
    } catch (err) {
      setMensajeMarcaje({
        tipo: "error",
        texto:
          err.response?.data?.message ||
            err.response?.data?.mensaje ||
            "Error al buscar trabajador",
      });
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
      <TopBar title="CHECKINOUT - INSPECTOR SST" subtitle="Control de jornada y asistencia" />

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
                    onClick={() => iniciarRegistro("ingreso")}
                  >
                    Registrar Ingreso
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline flex-1"
                    disabled={marcando}
                    onClick={() => iniciarRegistro("salida")}
                  >
                    Registrar salida
                  </button>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <hr className="flex-1" />
                  <span className="text-xs text-gray-400">Biometría</span>
                  <hr className="flex-1" />
                </div>
                <button type="button" className="btn btn-outline w-full" onClick={abrirRegistrarBiometrico}>
                  Registrar biométrico
                </button>
                {mostrarBiometrico && modoCamara && (
                  <CamaraFacial
                    modo={modoCamara}
                    descriptor={modoCamara === "verificar" ? descriptorParaCamara(trabajadorActual) : undefined}
                    onMatch={modoCamara === "verificar" ? handleBiometricoVerify : handleBiometricoRegistrar}
                    onClose={cerrarCamaraFacial}
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
                            const { label, cls } = etiquetaEstadoResumen(r);
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
