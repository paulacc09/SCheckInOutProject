import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import SortTh from "../../components/SortTh";
import { useSortable } from "../../hooks/useSortable";
import { paginate } from "../../services/pagination";
import { horaCorta } from "../../utils/formatHora";

const PAGE_SIZE = 10;

function badgeEstado(estado) {
  if (estado === "Activo") return "bg-[#dcfce7] text-[#16a34a]";
  if (estado === "Salida") return "bg-[#fef3c7] text-[#b45309]";
  return "bg-[#fee2e2] text-[#dc2626]";
}

export default function Asistencias() {
  const [q, setQ] = useState("");
  const [fecha, setFecha] = useState("");
  const [obraId, setObraId] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const { data } = await api.get("/asistencia/resumen-trabajadores", {
        params: { fecha, obra_id: obraId, search: q },
      });
      setRows(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setFlash({
        type: "error",
        message: e.response?.data?.message || "No se pudieron cargar los datos",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, fecha, obraId]);

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
  }, [cargar]);

  useEffect(() => {
    setPage(1);
  }, [q, fecha, obraId]);

  const registros_filtrados = rows;

  const totalRegistrados = registros_filtrados.length;
  const activos = registros_filtrados.filter((r) => r.estado === "Activo").length;
  const salida = registros_filtrados.filter((r) => r.estado === "Salida").length;

  const { sorted, sortCol, sortDir, toggle } = useSortable(registros_filtrados);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(sorted, page, PAGE_SIZE),
    [sorted, page]
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card card-body">
            <p className="text-sm text-slate-500">Total registrados</p>
            <p className="text-2xl font-bold text-[#1e3a6e]">{totalRegistrados}</p>
          </div>
          <div className="card card-body">
            <p className="text-sm text-slate-500">Activos</p>
            <p className="text-2xl font-bold text-[#1e3a6e]">{activos}</p>
          </div>
          <div className="card card-body">
            <p className="text-sm text-slate-500">Salida</p>
            <p className="text-2xl font-bold text-[#1e3a6e]">{salida}</p>
          </div>
        </div>

        <div className="card card-body flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
          <input
            className="input flex-1 min-w-[12rem]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
          />
          <input type="date" className="input sm:w-44" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <select className="select sm:min-w-[12rem]" value={obraId} onChange={(e) => setObraId(e.target.value)}>
            <option value="">Todas las obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16 text-slate-500">Cargando…</div>
        ) : registros_filtrados.length === 0 ? (
          <div className="card card-body text-center text-slate-500">
            No hay registros que coincidan con los filtros.
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <SortTh col="nombre" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                      Trabajador
                    </SortTh>
                    <SortTh col="cedula" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                      Cédula
                    </SortTh>
                    <SortTh col="obra" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                      Obra
                    </SortTh>
                    <SortTh col="fecha" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                      Fecha
                    </SortTh>
                    <th>Entradas</th>
                    <th>Salidas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, idx) => (
                    <tr key={`${r.trabajador_id}-${String(r.fecha)}-${r.obra}-${idx}`}>
                      <td>{r.nombre ?? "—"}</td>
                      <td className="font-mono text-xs">{r.cedula ?? "—"}</td>
                      <td>{r.obra ?? "—"}</td>
                      <td>{String(r.fecha).slice(0, 10)}</td>
                      <td>{horaCorta(r.hora_ingreso)}</td>
                      <td>{horaCorta(r.hora_salida)}</td>
                      <td>
                        <span className={`badge ${badgeEstado(r.estado)}`}>{r.estado ?? "—"}</span>
                      </td>
                      <td className="text-slate-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
