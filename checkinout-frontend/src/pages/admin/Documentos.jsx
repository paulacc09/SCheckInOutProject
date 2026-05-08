import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Search } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as documentosService from "../../services/documentosService";

const PAGE_SIZE = 8;
const TABS = [
  { key: "Todos", label: "Todos" },
  { key: "Vigentes", label: "Vigentes" },
  { key: "Por vencer", label: "Por Vencer" },
  { key: "Vencidos", label: "Vencidos" },
];

function fmtFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("es-CO");
  } catch {
    return iso;
  }
}

function badgeEstado(estado) {
  if (estado === "Vigente") return { bg: "#dcfce7", color: "#15803d" };
  if (estado === "Por vencer") return { bg: "#fef9c3", color: "#854d0e" };
  return { bg: "#fee2e2", color: "#991b1b" };
}

export default function Documentos() {
  const [tab, setTab] = useState("Todos");
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tipoDoc, setTipoDoc] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [alerta, setAlerta] = useState({ mostrar: false, cantidad: 0, fechaLimite: null });
  const [tiposOpts, setTiposOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipo: "", emision: "", vencimiento: "" });
  const [formErr, setFormErr] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await documentosService.getAll({
      tab,
      tipo: tipoDoc,
      search: q,
      estadoFiltro,
    });
    setLoading(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      setRows([]);
      return;
    }
    setRows(res.data);
    const a = await documentosService.getAlertaPorVencer();
    if (a.ok) setAlerta(a.data);
  }, [tab, tipoDoc, q, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setTiposOpts(documentosService.getTiposOpciones());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, q, estadoFiltro, tipoDoc]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const abrirEditar = async (row) => {
    setEditing(row);
    setFormErr({});
    const res = await documentosService.getById(row.id);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    const d = res.data;
    setForm({
      tipo: d.tipo,
      emision: d.emision,
      vencimiento: d.vencimiento,
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.tipo.trim()) e.tipo = "Obligatorio";
    if (!form.emision) e.emision = "Obligatorio";
    if (!form.vencimiento) e.vencimiento = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const res = await documentosService.update(editing.id, {
      tipo: form.tipo.trim(),
      emision: form.emision,
      vencimiento: form.vencimiento,
    });
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({ type: "ok", message: "Cambios guardados" });
    setModalOpen(false);
    const a = await documentosService.getAlertaPorVencer();
    if (a.ok) setAlerta(a.data);
    await cargar();
  };

  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de documentos del personal</h2>
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="flex gap-4 border-b border-slate-200 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pb-2 text-sm transition-colors ${
                tab === t.key ? "border-b-2 border-[#1565C0] text-[#1565C0] font-medium" : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {alerta.mostrar && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "#fef9c3", border: "1px solid #fde047", color: "#713f12" }}
          >
            {alerta.cantidad} Documentos próximos a vencer — revisar antes del {alerta.fechaLimite}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 w-full" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select lg:w-48" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="">Estado</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Vencido</option>
          </select>
          <select className="select lg:w-56" value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
            <option value="">Documento</option>
            {tiposOpts.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 flex justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e2a4a]" />
          </div>
        ) : (
          <div className="table-wrap rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trabajador</th>
                  <th>Documento</th>
                  <th>Emisión</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, idx) => {
                  const st = badgeEstado(d.estado);
                  return (
                    <tr key={d.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                      <td>{d.id}</td>
                      <td>{d.trabajador}</td>
                      <td>{d.tipo}</td>
                      <td>{fmtFecha(d.emision)}</td>
                      <td>{fmtFecha(d.vencimiento)}</td>
                      <td>
                        <span
                          className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {d.estado}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" title="Editar" onClick={() => abrirEditar(d)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar documento"
        size="md"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn text-white" style={{ background: "#1e2a4a" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar cambios
            </button>
          </>
        )}
      >
        <form className="space-y-4" onSubmit={guardar}>
          <div>
            <label className="label">Tipo</label>
            <select className="select w-full" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
              {tiposOpts.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {formErr.tipo && <p className="text-xs text-red-600 mt-1">{formErr.tipo}</p>}
          </div>
          <div>
            <label className="label">Emisión</label>
            <input type="date" className="input w-full" value={form.emision} onChange={(e) => setForm((f) => ({ ...f, emision: e.target.value }))} />
            {formErr.emision && <p className="text-xs text-red-600 mt-1">{formErr.emision}</p>}
          </div>
          <div>
            <label className="label">Vencimiento</label>
            <input type="date" className="input w-full" value={form.vencimiento} onChange={(e) => setForm((f) => ({ ...f, vencimiento: e.target.value }))} />
            {formErr.vencimiento && <p className="text-xs text-red-600 mt-1">{formErr.vencimiento}</p>}
          </div>
        </form>
      </Modal>
    </>
  );
}
