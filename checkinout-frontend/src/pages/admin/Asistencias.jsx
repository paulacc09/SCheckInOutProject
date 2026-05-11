import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";

const PAGE_SIZE = 10;

function badgeTipo(tipo) {
  if (tipo === "ingreso") return "bg-[#dbeafe] text-[#1d4ed8]";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

function badgeEstado(estado) {
  const e = String(estado || "").toLowerCase();
  if (e === "valido") return "bg-[#dcfce7] text-[#16a34a]";
  return "bg-[#fee2e2] text-[#dc2626]";
}

export default function Asistencias() {
  const [q, setQ] = useState("");
  const [fecha, setFecha] = useState("");
  const [obraId, setObraId] = useState("");
  const [tipo, setTipo] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [obras, setObras] = useState([]);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const { data } = await api.get("/asistencia/registros", {
        params: { obra_id: obraId, fecha, tipo, search: q },
      });
      setRows(Array.isArray(data) ? data : data.data ?? data);
    } catch (e) {
      setFlash({
        type: "error",
        message: e.response?.data?.message || "No se pudieron cargar los registros",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, fecha, obraId, tipo]);

  const cargarResumen = useCallback(async () => {
    try {
      const f = fecha || new Date().toISOString().slice(0, 10);
      const { data } = await api.get(`/asistencia/resumen?fecha=${encodeURIComponent(f)}`);
      setResumen(data.data ?? data);
    } catch {
    }
  }, [fecha]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/obras");
        setObras(Array.isArray(data) ? data : data.data ?? []);
      } catch {
        setObras([]);
      }
    })();
  }, []);

  useEffect(() => {
    cargar();
    cargarResumen();
  }, [cargar, cargarResumen]);

  useEffect(() => {
    setPage(1);
  }, [q, fecha, obraId, tipo]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  return (
    <>
      <TopBar title="Gestión Asistencias" />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && (
          <FlashBanner
            type={flash.type === "error" ? "error" : "ok"}
            message={flash.message}
            onClose={() => setFlash(null)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card card-body">
            <p className="text-sm text-slate-500">Asistentes</p>
            <p className="text-2xl font-bold text-[#1e3a6e]">{resumen.asistentes ?? 0}</p>
          </div>
          <div className="card card-body">
            <p className="text-sm text-slate-500">% Asistencia</p>
            <p className="text-2xl font-bold text-[#1e3a6e]">
              {resumen.porcentaje_asistencia ?? 0}
              <span className="text-lg font-semibold text-slate-600">%</span>
            </p>
          </div>
        </div>

        <div className="card card-body flex flex-col lg:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
            />
          </div>
          <input
            type="date"
            className="input sm:w-44"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <select className="select sm:min-w-[12rem]" value={obraId} onChange={(e) => setObraId(e.target.value)}>
            <option value="">Todas las obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
          <select className="select sm:w-40" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Tipo</option>
            <option value="ingreso">ingreso</option>
            <option value="salida">salida</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a6e]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="card card-body text-center text-slate-500">
            No hay registros que coincidan con los filtros.
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trabajador</th>
                    <th>Cédula</th>
                    <th>Obra</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.trabajador ?? "—"}</td>
                      <td className="font-mono text-sm">{r.cedula ?? "—"}</td>
                      <td>{r.obra_nombre ?? "—"}</td>
                      <td>{String(r.fecha).slice(0, 10)}</td>
                      <td>{String(r.timestamp).slice(11, 16)}</td>
                      <td>
                        <span className={`badge ${badgeTipo(r.tipo)}`}>{r.tipo ?? "—"}</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeEstado(r.estado)}`}>{r.estado ?? "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && rows.length > 0 && (
              <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>
    </>
  );
}
