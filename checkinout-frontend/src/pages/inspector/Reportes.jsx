import { useState } from "react";
import { Loader2, AlertCircle, FileBarChart2, Download } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
import * as XLSX from 'xlsx';

const TIPOS = [
  { value: "asistencia", label: "Asistencia diaria" },
  { value: "ausencias", label: "Ausencias" },
  { value: "horas", label: "Horas trabajadas" },
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

  const formatearValor = (v) => {
    if (v === null || v === undefined) return "—";
    const s = String(v);
    // detecta formato ISO datetime
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      const d = new Date(s);
      return d.toLocaleString("es-CO", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
      });
    }
    // detecta formato solo fecha YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }
    return s;
  };

  return (
    <>
      <TopBar title="Reportes" subtitle="Consulta reportes de tu obra" />
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
            <input type="date" className="input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
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
              <button
                className="btn btn-outline"
                onClick={() => {
                  if (!data || data.length === 0) return;
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
                  XLSX.writeFile(wb, `reporte_${tipo}_${fechaInicio}_${fechaFin}.xlsx`);
                }}
              >
                <Download className="w-4 h-4" /> Exportar
              </button>
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
                        <td key={j}>{formatearValor(v)}</td>
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
