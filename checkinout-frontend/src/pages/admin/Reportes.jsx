import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as reportesService from "../../services/reportesService";
import { getNombresObras } from "../../services/obrasService";

const PAGE_SIZE = 10;

async function ensurePdfLibs() {
  if (window.jspdf?.jsPDF && window.jspdf?.jsPDF?.API?.autoTable) return;
  const script1 = document.createElement("script");
  script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  await new Promise((resolve, reject) => {
    script1.onload = resolve;
    script1.onerror = reject;
    document.body.appendChild(script1);
  });
  const script2 = document.createElement("script");
  script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
  await new Promise((resolve, reject) => {
    script2.onload = resolve;
    script2.onerror = reject;
    document.body.appendChild(script2);
  });
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
  const [resumen, setResumen] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [vacio, setVacio] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState({ obra: "", estado: "", fi: "", ff: "" });

  useEffect(() => {
    (async () => {
      const r = await getNombresObras();
      if (r.ok) setObrasOpts(r.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [trabajadores.length]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(trabajadores, page, PAGE_SIZE),
    [trabajadores, page]
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
      setFlash({ type: "error", message: "Genere un reporte con datos antes de exportar" });
      return;
    }
    const headers = ["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"];
    const lines = trabajadores.map((r) =>
      [r.id, r.nombre, r.obra, r.diasAsistidos, r.ausencias, r.horasTotales].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte-asistencias.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    setFlash({ type: "ok", message: "CSV descargado" });
  };

  const exportPDF = async () => {
    if (!trabajadores.length) {
      setFlash({ type: "error", message: "Genere un reporte con datos antes de exportar" });
      return;
    }
    try {
      setLoading(true);
      await ensurePdfLibs();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(14);
      doc.text("Reporte de asistencias", 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Obra: ${filtrosAplicados.obra || "Todas"}`, 14, y);
      y += 5;
      doc.text(`Estado asistencia: ${filtrosAplicados.estado || "Todos"}`, 14, y);
      y += 5;
      doc.text(`Periodo: ${filtrosAplicados.fi || "…"} — ${filtrosAplicados.ff || "…"}`, 14, y);
      y += 8;
      if (resumen) {
        doc.text(`Total registros: ${resumen.totalRegistros}`, 14, y);
        y += 5;
        doc.text(`Días con asistencia: ${resumen.diasConAsistencia}`, 14, y);
        y += 5;
        doc.text(`Ausencias totales: ${resumen.ausenciasTotales}`, 14, y);
        y += 5;
        doc.text(`Promedio diario: ${resumen.promedioDiario}`, 14, y);
        y += 6;
      }
      doc.autoTable({
        startY: y,
        head: [["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"]],
        body: trabajadores.map((r) => [
          r.id,
          r.nombre,
          r.obra,
          r.diasAsistidos,
          r.ausencias,
          r.horasTotales,
        ]),
      });
      doc.save("reporte-asistencias.pdf");
      setFlash({ type: "ok", message: "PDF descargado" });
    } catch (e) {
      setFlash({ type: "error", message: "No se pudo generar el PDF" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar
        right={(
          <div className="flex gap-2">
            <button type="button" className="btn text-white bg-slate-700" onClick={exportCSV}>Exportar CSV</button>
            <button type="button" className="btn text-white" style={{ background: "#1565C0" }} onClick={exportPDF}>Exportar PDF</button>
          </div>
        )}
      />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Reportes</h2>
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="card card-body grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>
            <option value="">Obra</option>
            {obrasOpts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option>Presente</option>
            <option>Ausente</option>
            <option>Salida</option>
          </select>
          <input type="date" className="input" value={fi} onChange={(e) => setFi(e.target.value)} />
          <input type="date" className="input" value={ff} onChange={(e) => setFf(e.target.value)} />
          <button type="button" className="btn text-white flex items-center justify-center gap-2" style={{ background: "#1565C0" }} disabled={loading} onClick={generar}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generar
          </button>
        </div>

        {generated && resumen && (
          <>
            {vacio ? (
              <p className="text-slate-600">No hay resultados para los filtros seleccionados.</p>
            ) : (
              <>
                <div className="rounded-xl border bg-white p-4 text-sm text-slate-700 space-y-1 shadow-sm">
                  <div><strong>Total registros:</strong> {resumen.totalRegistros}</div>
                  <div><strong>Días con asistencia:</strong> {resumen.diasConAsistencia}</div>
                  <div><strong>Ausencias totales:</strong> {resumen.ausenciasTotales}</div>
                  <div><strong>Promedio diario:</strong> {resumen.promedioDiario}</div>
                </div>
                <div className="table-wrap">
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
                        <tr key={`${r.id}-${r.nombre}-${r.obra}`} className={idx % 2 ? "bg-slate-50/50" : ""}>
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
                {trabajadores.length > 0 && (
                  <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
