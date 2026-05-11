import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Play, Square, UserCheck, UserX, Clock } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";

export default function Asistencia() {
  const { usuario } = useAuth();
  const [obra, setObra] = useState(null);
  const [jornada, setJornada] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cedula, setCedula] = useState("");
  const [tipoMarcaje, setTipoMarcaje] = useState("ingreso");
  const [marcando, setMarcando] = useState(false);
  const [mensajeMarcaje, setMensajeMarcaje] = useState(null);
  const [errorJornada, setErrorJornada] = useState("");

  const hoy = () => new Date().toISOString().slice(0, 10);

  const cargarRegistrosDia = async (obraId) => {
    const { data: body } = await api.get("/asistencia/registros", {
      params: { obra_id: obraId, fecha: hoy() },
    });
    console.log("REGISTROS RESPONSE:", JSON.stringify(body));
    const raw = body?.registros ?? body?.data ?? body;
    const list = Array.isArray(raw) ? raw : [];
    setRegistros(list);
  };

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: bodyObras } = await api.get("/obras");
        const rawObras = bodyObras?.obras ?? bodyObras?.data ?? bodyObras;
        const obrasList = Array.isArray(rawObras) ? rawObras : [];
        const primera = obrasList[0] ?? null;
        setObra(primera);

        if (!primera) {
          setJornada(null);
          setRegistros([]);
          return;
        }

        const { data: bodyJornadas } = await api.get("/asistencia/jornadas", {
          params: { obra_id: primera.id },
        });
        const rawJ = bodyJornadas?.obras ?? bodyJornadas?.data ?? bodyJornadas;
        const jornadasList = Array.isArray(rawJ) ? rawJ : [];
        const abierta = jornadasList.find((j) => j.estado === "abierta") ?? null;
        setJornada(abierta);

        if (abierta) {
          await cargarRegistrosDia(primera.id);
        } else {
          setRegistros([]);
        }
      } catch (err) {
        setError(
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo cargar la asistencia"
        );
        setObra(null);
        setJornada(null);
        setRegistros([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  useEffect(() => {
    if (!mensajeMarcaje) return undefined;
    const t = window.setTimeout(() => setMensajeMarcaje(null), 3000);
    return () => clearTimeout(t);
  }, [mensajeMarcaje]);

  const abrirJornada = async () => {
    if (!obra?.id) return;
    setErrorJornada("");
    try {
      await api.post("/asistencia/jornada/abrir", { obra_id: obra.id });
      const { data: bodyJornadas } = await api.get("/asistencia/jornadas", {
        params: { obra_id: obra.id },
      });
      const rawJ = bodyJornadas?.obras ?? bodyJornadas?.data ?? bodyJornadas;
      const jornadasList = Array.isArray(rawJ) ? rawJ : [];
      const abierta = jornadasList.find((j) => j.estado === "abierta") ?? null;
      setJornada(abierta);
      if (abierta) await cargarRegistrosDia(obra.id);
      else setRegistros([]);
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
    setErrorJornada("");
    try {
      await api.patch(`/asistencia/jornada/${jornada.id}/cerrar`);
      setJornada(null);
      setRegistros([]);
    } catch (err) {
      setErrorJornada(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo cerrar la jornada"
      );
    }
  };

  const registrarMarcaje = async () => {
    if (!cedula.trim()) {
      setMensajeMarcaje({ tipo: "error", texto: "Ingresa la cédula" });
      return;
    }
    if (!obra?.id) return;

    setMarcando(true);
    try {
      console.log("MARCAJE payload:", { cedula: cedula.trim(), tipo: tipoMarcaje, obra_id: obra?.id, obra_nombre: obra?.nombre });
      const { data: body } = await api.post("/asistencia/registrar", {
        cedula: cedula.trim(),
        tipo: tipoMarcaje,
        obra_id: obra.id,
        metodo: "cedula",
      });
      const respuesta = body?.data ?? body;
      setMensajeMarcaje({
        tipo: "success",
        texto: respuesta?.mensaje ?? "Registrado correctamente",
      });
      setCedula("");
      await cargarRegistrosDia(obra.id);
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

  const horaApertura = jornada?.hora_apertura
    ? new Date(jornada.hora_apertura).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <>
      <TopBar title="Asistencia" subtitle="Control de jornada y marcaje" />

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
            <div className="card card-body space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Obra</p>
                  <p className="font-semibold text-slate-800 text-lg">
                    {obra?.nombre ?? "—"}
                  </p>
                  {usuario && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      {usuario.nombre} {usuario.apellido ?? ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  {errorJornada && (
                    <p className="text-sm text-red-600 max-w-md text-left sm:text-right">
                      {errorJornada}
                    </p>
                  )}
                  {!jornada ? (
                    <>
                      <p className="text-slate-600">Sin jornada activa</p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={abrirJornada}
                        disabled={!obra?.id}
                      >
                        <Play className="w-4 h-4" /> Abrir Jornada
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="badge badge-success">Jornada Abierta</span>
                      {horaApertura && (
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Apertura: {horaApertura}
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn bg-red-600 text-white hover:bg-red-700"
                        onClick={cerrarJornada}
                      >
                        <Square className="w-4 h-4" /> Cerrar Jornada
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {jornada && (
              <div className="card card-body space-y-4">
                <h3 className="font-semibold text-slate-800">Registrar Marcaje</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo</label>
                    <select
                      className="select"
                      value={tipoMarcaje}
                      onChange={(e) => setTipoMarcaje(e.target.value)}
                    >
                      <option value="ingreso">ingreso</option>
                      <option value="salida">salida</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Cédula</label>
                    <input
                      className="input"
                      placeholder="Ingresa la cédula del trabajador"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={registrarMarcaje}
                  disabled={marcando}
                >
                  {marcando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : tipoMarcaje === "salida" ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Registrar
                </button>
                {mensajeMarcaje && (
                  <div
                    className={
                      mensajeMarcaje.tipo === "success"
                        ? "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                        : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    }
                  >
                    {mensajeMarcaje.texto}
                  </div>
                )}
              </div>
            )}

            {jornada && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold">
                    Presentes hoy ({registros.length})
                  </h3>
                </div>
                {registros.length === 0 ? (
                  <div className="card-body">
                    <EmptyState
                      title="Sin registros"
                      message="Aún no hay marcajes hoy."
                    />
                  </div>
                ) : (
                  <div className="table-wrap rounded-none border-0">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Trabajador</th>
                          <th>Cédula</th>
                          <th>Tipo</th>
                          <th>Hora</th>
                          <th>Método</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registros.map((r) => (
                          <tr key={r.id}>
                            <td className="font-medium text-slate-800">
                              {r.trabajador ?? "—"}
                            </td>
                            <td className="font-mono text-xs">{r.cedula ?? "—"}</td>
                            <td>
                              <span
                                className={
                                  r.tipo === "ingreso"
                                    ? "badge badge-success"
                                    : "badge badge-muted"
                                }
                              >
                                {r.tipo ?? "—"}
                              </span>
                            </td>
                            <td className="text-slate-700">
                              {r.timestamp
                                ? new Date(r.timestamp).toLocaleTimeString("es-CO", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })
                                : "—"}
                            </td>
                            <td className="text-slate-600">{r.metodo ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
