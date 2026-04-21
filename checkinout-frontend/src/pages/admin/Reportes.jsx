import { useState } from "react";
import { Loader2, AlertCircle, FileBarChart2, Download } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

const TIPOS = [
  { value: "asistencia", label: "Asistencia diaria" },
  { value: "ausencias", label: "Ausencias" },
  { value: "horas_trabajadas", label: "Horas trabajadas" },
];

export default function Reportes() {
  const [tipo, setTipo] = useState("asistencia");
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    try {
      const { data: res } = await api.get(`/reportes/${tipo}`, {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      });
      setData(res.resultados || res.data || res || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="Reportes" subtitle="Genera reportes operativos" />
      <div className="p-6 space-y-4">
        <form onSubmit={generar} className="card card-body grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Tipo de reporte</label>
            <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha inicio</label>
            <input type="date" className="input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input type="date" className="input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart2 className="w-4 h-4" />}
            Generar
          </button>
        </form>

        {error && (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {data && data.length === 0 && !error && (
          <div className="card"><EmptyState title="Sin datos" message="El reporte no devolvió resultados." /></div>
        )}

        {data && data.length > 0 && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Resultados ({data.length})</h3>
              <button className="btn btn-outline"><Download className="w-4 h-4" /> Exportar</button>
            </div>
            <div className="table-wrap rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((k) => <th key={k}>{k.replace(/_/g, " ")}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j}>{v === null || v === undefined ? "—" : String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
