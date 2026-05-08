import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as novedadesService from "../../services/novedadesService";

const PAGE_SIZE = 5;
const TABS = ["Pendientes", "Novedades", "Traspasos", "Todas"];

export default function Notificaciones() {
  const [tipo, setTipo] = useState("Todos");
  const [tab, setTab] = useState("Pendientes");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [motivos, setMotivos] = useState({});
  const [flash, setFlash] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const r = await novedadesService.getAll({ tipo, tab });
    setLoading(false);
    if (!r.ok) {
      setFlash({ type: "error", message: r.message });
      setRows([]);
      return;
    }
    setRows(r.data);
  }, [tipo, tab]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPage(1);
  }, [tipo, tab, rows.length]);

  const { items, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const aprobar = async (row) => {
    const r = await novedadesService.setEstado(row.id, { estado: "Aprobado" });
    if (!r.ok) {
      setFlash({ type: "error", message: r.message });
      return;
    }
    await cargar();
  };

  const rechazar = async (row) => {
    const motivo = (motivos[row.id] || "").trim();
    if (!motivo) {
      setFlash({ type: "error", message: "Ingresa un motivo de rechazo" });
      return;
    }
    const r = await novedadesService.setEstado(row.id, { estado: "Rechazado", motivoRechazo: motivo });
    if (!r.ok) {
      setFlash({ type: "error", message: r.message });
      return;
    }
    await cargar();
  };

  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Gestión de novedades</h2>
          <select className="select w-48" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option>Todos</option>
            <option>Novedad</option>
            <option>Traspaso</option>
          </select>
        </div>

        {flash && <FlashBanner type={flash.type} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="flex gap-4 border-b border-slate-200 pb-1 text-sm flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              className={`${tab === t ? "text-blue-700 border-b-2 border-blue-600 font-medium" : "text-slate-500"}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e2a4a]" />
          </div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800">{n.trabajador}</div>
                  <div className="text-sm text-slate-500">{n.cargo} · {n.obra}</div>
                  <div className="text-sm text-slate-500">Registrado por {n.registradoPor}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {n.estado === "Pendiente" && <span className="badge bg-yellow-100 text-yellow-700">Pendiente</span>}
                  <span className={`badge ${n.tipo === "Novedad" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{n.tipo}</span>
                </div>
              </div>

              {n.tipo === "Novedad" ? (
                <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-700">
                  <div><span className="text-slate-500">Tipo/subTipo:</span> {n.subTipo || "—"}</div>
                  <div><span className="text-slate-500">Fecha:</span> {n.fecha}</div>
                  <div><span className="text-slate-500">Días:</span> {n.dias ?? "—"}</div>
                  {n.adjunto && (
                    <div className="md:col-span-3 flex items-center gap-2 text-red-600">
                      <FileText className="w-4 h-4" />
                      <button className="underline">{n.adjunto}</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-700">
                  <div><span className="text-slate-500">Fecha:</span> {n.fecha}</div>
                  <div><span className="text-slate-500">Origen:</span> {n.origen}</div>
                  <div><span className="text-slate-500">Destino:</span> {n.destino}</div>
                </div>
              )}

              <input
                className="input w-full"
                placeholder="Motivo de rechazo (opcional)"
                value={motivos[n.id] || ""}
                onChange={(e) => setMotivos((m) => ({ ...m, [n.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <button className="btn border border-red-500 text-red-600 bg-white" onClick={() => rechazar(n)}>Rechazar</button>
                <button className="btn text-white" style={{ background: "#22c55e" }} onClick={() => aprobar(n)}>Aprobar</button>
              </div>
            </div>
          ))
        )}

        {rows.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>
    </>
  );
}
