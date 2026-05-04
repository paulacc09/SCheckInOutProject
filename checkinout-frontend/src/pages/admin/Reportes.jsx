import { useMemo, useState } from "react";
import TopBar from "../../components/TopBar";
const ROWS = [
  { id: 1, nombre: "Pepito Andres Perez Roa", obra: "Mandarino", dias: 20, ausencias: 0, horas: 240, estado: "Activo" },
  { id: 2, nombre: "Jose Steven Peña Hernan", obra: "H. Peñalisa", dias: 18, ausencias: 2, horas: 216, estado: "Activo" },
  { id: 3, nombre: "Javier Esteban Rendón", obra: "H. Nakare", dias: 20, ausencias: 0, horas: 240, estado: "Activo" },
  { id: 4, nombre: "Pepito Andres Perez Roa", obra: "Mandarino", dias: 15, ausencias: 5, horas: 180, estado: "Inactivo" },
  { id: 5, nombre: "Jose Steven Peña Hernan", obra: "H. Peñalisa", dias: 20, ausencias: 0, horas: 240, estado: "Activo" },
];

export default function Reportes() {
  const [obra, setObra] = useState("");
  const [estado, setEstado] = useState("");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");
  const [page, setPage] = useState(1);
  const [generated, setGenerated] = useState(false);
  const perPage = 4;

  const filtered = useMemo(() => ROWS.filter((r) => {
    const okObra = !obra || r.obra === obra;
    const okEstado = !estado || r.estado === estado;
    return okObra && okEstado;
  }), [obra, estado]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const data = filtered.slice((page - 1) * perPage, page * perPage);

  const exportCSV = () => {
    const headers = ["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"];
    const lines = filtered.map((r) => [r.id, r.nombre, r.obra, r.dias, r.ausencias, r.horas].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const ensurePdfLibs = async () => {
    if (window.jspdf?.jsPDF && window.jspdf?.jsPDF.API?.autoTable) return;
    const script1 = document.createElement("script");
    script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    await new Promise((resolve, reject) => { script1.onload = resolve; script1.onerror = reject; document.body.appendChild(script1); });
    const script2 = document.createElement("script");
    script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
    await new Promise((resolve, reject) => { script2.onload = resolve; script2.onerror = reject; document.body.appendChild(script2); });
  };

  const exportPDF = async () => {
    await ensurePdfLibs();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Gestion Reportes", 14, 14);
    doc.text("Total registros: 3001", 14, 24);
    doc.text("Dias con asistencia: 20 dias", 14, 30);
    doc.text("Ausencias totales: 15", 14, 36);
    doc.text("Promedio diario: 110 trabajadores", 14, 42);
    doc.autoTable({
      startY: 50,
      head: [["ID", "Nombre", "Obra", "Días asistidos", "Ausencias", "Horas totales"]],
      body: filtered.map((r) => [r.id, r.nombre, r.obra, r.dias, r.ausencias, r.horas]),
    });
    doc.save("reporte.pdf");
  };

  return (
    <>
      <TopBar right={<div className="flex gap-2"><button className="btn text-white bg-slate-700" onClick={exportCSV}>Exportar CSV</button><button className="btn text-white" style={{ background: "#1565C0" }} onClick={exportPDF}>Exportar PDF</button></div>} />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión Reportes</h2>
        <div className="card card-body grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}><option value="">Obra</option><option>Mandarino</option><option>H. Peñalisa</option><option>H. Nakare</option></select>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Estado</option><option>Activo</option><option>Inactivo</option></select>
          <input type="date" className="input" value={fi} onChange={(e) => setFi(e.target.value)} />
          <input type="date" className="input" value={ff} onChange={(e) => setFf(e.target.value)} />
          <button className="btn text-white" style={{ background: "#1565C0" }} onClick={() => setGenerated(true)}>Generar</button>
        </div>

        {generated && (
          <>
            <div className="text-sm text-slate-700 space-y-1">
              <div>Total registros: 3001</div><div>Días con asistencia: 20 días</div><div>Ausencias totales: 15</div><div>Promedio diario: 110 trabajadores</div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Obra</th><th>Días asistidos</th><th>Ausencias</th><th>Horas totales</th></tr></thead>
                <tbody>{data.map((r, idx) => <tr key={r.id + r.nombre} className={idx % 2 ? "bg-slate-50/50" : ""}><td>{r.id}</td><td>{r.nombre}</td><td>{r.obra}</td><td>{r.dias}</td><td>{r.ausencias}</td><td>{r.horas}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="flex justify-center text-sm text-slate-600 gap-3">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>« Previous</button>
              <span>{page}</span><span>2</span><span>3</span><span>...</span><span>67</span><span>68</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next »</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
