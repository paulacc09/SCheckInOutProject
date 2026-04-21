import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Calendar } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Asistencias() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/asistencia", { params: { fecha } });
      setRegistros(data.registros || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cargar la asistencia");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, [fecha]);

  return (
    <>
      <TopBar title="Asistencias" subtitle="Consulta los registros de ingreso y salida" />
      <div className="p-6 space-y-4">
        <div className="card card-body flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div>
            <label className="label">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" className="input pl-9" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card card-body flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> {error}</div>
        ) : registros.length === 0 ? (
          <div className="card"><EmptyState title="Sin registros" message="No hay asistencias registradas en esta fecha." /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Trabajador</th><th>Cédula</th><th>Obra</th><th>Tipo</th><th>Hora</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.trabajador || `${r.nombre || ""} ${r.apellido || ""}`}</td>
                    <td className="font-mono text-xs">{r.cedula}</td>
                    <td>{r.obra_nombre || r.obra || "—"}</td>
                    <td>
                      <span className={r.tipo === "ingreso" ? "badge badge-info" : "badge badge-muted"}>{r.tipo}</span>
                    </td>
                    <td className="font-mono text-xs">{new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      <span className={r.estado === "valido" ? "badge badge-success" : r.estado === "duplicado" ? "badge badge-warning" : "badge badge-danger"}>
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
