import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import TopBar from "../../components/TopBar";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as reportesService from "../../services/reportesService";
import { getNombresObras } from "../../services/obrasService";

const PAGE_SIZE_GENERATED = 10;
const PAGE_SIZE_DEFAULT = 2;

function fileStamp() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reportes() {
  const [obra, setObra] = useState("");
  const [estado, setEstado] = useState("");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");
  const [page, setPage] = useState(1);
  const [obrasOpts, setObrasOpts] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const [resumen, setResumen] = useState(() => reportesService.getResumenGlobal());
  const [trabajadores, setTrabajadores] = useState(() => [...reportesService.MOCK_TABLA_REPORTES]);
  const [vacio, setVacio] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState({ obra: "", estado: "", fi: "", ff: "" });

  const pageSize = generated ? PAGE_SIZE_GENERATED : PAGE_SIZE_DEFAULT;

  useEffect(() => {
    (async () => {
      const r = await getNombresObras();
      if (r.ok) setObrasOpts(r.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [trabajadores.length, pageSize, generated]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(trabajadores, page, pageSize),
    [trabajadores, page, pageSize]
  );

  const generar = async () => {
    setLoading(true);
    setFlash(null);
    const res = await reportesService.generar({
      obra,
      estado,
      fechaInicio: fi,
      fechaFin: ff,
    });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFiltrosAplicados({ obra, estado, fi, ff });
    setResumen(res.data.resumen);
    setTrabajadores(res.data.trabajadores || []);
    setVacio(!!res.data.vacio);
    setGenerated(true);
  };

  const exportCSV = () => {
    if (!trabajadores.length) {
      setFlash({ type: "error", message: "No hay filas para exportar" });
      return;
    }
    const headers = ["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"];
    const lines = trabajadores.map((r) =>
      [r.id, r.nombre, r.obra, r.diasAsistidos, r.ausencias, r.horasTotales]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_asistencias_${fileStamp()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setFlash({ type: "ok", message: "CSV descargado" });
  };

  const exportPDF = () => {
    if (!trabajadores.length) {
      setFlash({ type: "error", message: "No hay filas para exportar" });
      return;
    }
    try {
      setLoading(true);
      const f = generated ? filtrosAplicados : { obra, estado, fi, ff };
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(14);
      doc.text("Reporte de asistencias", 14, y);
      y += 8;
      doc.setFontSize(10);
      const hoy = new Date().toLocaleString("es-CO");
      doc.text(`Generado: ${hoy}`, 14, y);
      y += 6;
      doc.text(`Obra: ${f.obra || "Todas"}`, 14, y);
      y += 5;
      doc.text(`Estado: ${f.estado || "Todos"}`, 14, y);
      y += 5;
      doc.text(`Periodo: ${f.fi || "—"} — ${f.ff || "—"}`, 14, y);
      y += 8;
      doc.setFont(undefined, "bold");
      doc.text("Resumen del periodo", 14, y);
      y += 6;
      doc.setFont(undefined, "normal");
      const r = resumen;
      doc.text(`Total registros: ${r.totalRegistros}`, 14, y);
      y += 5;
      doc.text(`Días con asistencia: ${r.diasConAsistencia} días`, 14, y);
      y += 5;
      doc.text(`Ausencias totales: ${r.ausenciasTotales}`, 14, y);
      y += 5;
      doc.text(`Promedio diario: ${r.promedioDiario} trabajadores`, 14, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"]],
        body: trabajadores.map((row) => [
          row.id,
          row.nombre,
          row.obra,
          row.diasAsistidos,
          row.ausencias,
          row.horasTotales,
        ]),
      });
      doc.save(`reporte_asistencias_${fileStamp()}.pdf`);
      setFlash({ type: "ok", message: "PDF descargado" });
    } catch {
      setFlash({ type: "error", message: "No se pudo generar el PDF" });
    } finally {
      setLoading(false);
    }
  };

  const btnExport =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50";
  const btnExportStyle = { background: "#1e2a4a" };

  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4 bg-slate-50/50 min-h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Gestión Reportes</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnExport} style={btnExportStyle} onClick={exportCSV}>
              Exportar CSV
            </button>
            <button type="button" className={btnExport} style={btnExportStyle} onClick={exportPDF}>
              Exportar PDF
            </button>
          </div>
        </div>
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_1fr_auto] gap-3 items-end">
            <div>
              <label className="label">Obra</label>
              <select className="select w-full" value={obra} onChange={(e) => setObra(e.target.value)}>
                <option value="">Todas</option>
                {obrasOpts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select w-full" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option>Presente</option>
                <option>Ausente</option>
                <option>Salida</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha Inicio</label>
              <input type="date" className="input w-full" value={fi} onChange={(e) => setFi(e.target.value)} />
            </div>
            <div className="flex items-end justify-center pb-2 text-slate-400 font-medium hidden lg:flex">—</div>
            <div>
              <label className="label">Fecha Fin</label>
              <input type="date" className="input w-full" value={ff} onChange={(e) => setFf(e.target.value)} />
            </div>
            <div className="lg:col-span-1">
              <label className="label opacity-0 pointer-events-none hidden lg:block">Generar</label>
              <button
                type="button"
                className="btn text-white w-full flex items-center justify-center gap-2"
                style={{ background: "#1e2a4a" }}
                disabled={loading}
                onClick={generar}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generar
              </button>
            </div>
          </div>
          <div className="lg:hidden flex items-center justify-center py-1 text-slate-400">—</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800">Resumen del periodo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Total registros</span>
              <span className="font-medium text-slate-900">{resumen.totalRegistros}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Días con asistencia</span>
              <span className="font-medium text-slate-900">{resumen.diasConAsistencia} días</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Ausencias totales</span>
              <span className="font-medium text-slate-900">{resumen.ausenciasTotales}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Promedio diario</span>
              <span className="font-medium text-slate-900">{resumen.promedioDiario} trabajadores</span>
            </div>
          </div>
        </div>

        {generated && vacio ? (
          <p className="text-slate-600">No hay resultados para los filtros seleccionados.</p>
        ) : (
          <>
            <div className="table-wrap rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Obra</th>
                    <th>Días asistidos</th>
                    <th>Ausencias</th>
                    <th>Horas totales</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, idx) => (
                    <tr key={`${r.id}-${idx}`} className={idx % 2 ? "bg-slate-50/50" : ""}>
                      <td>{r.id}</td>
                      <td>{r.nombre}</td>
                      <td>{r.obra}</td>
                      <td>{r.diasAsistidos}</td>
                      <td>{r.ausencias}</td>
                      <td>{r.horasTotales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trabajadores.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
          </>
        )}
      </div>
    </>
  );
}
