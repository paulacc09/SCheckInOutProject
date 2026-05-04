import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as documentosService from "../../services/documentosService";
import { listTrabajadoresParaSelect } from "../../services/personalService";

const PAGE_SIZE = 10;
const TABS = [
  { key: "Todos", label: "Todos" },
  { key: "Vigentes", label: "Vigentes" },
  { key: "Por vencer", label: "Por vencer" },
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

function badgeClass(estado) {
  if (estado === "Vigente") return "bg-[#4CAF50] text-white";
  if (estado === "Por vencer") return "bg-orange-400 text-white";
  return "bg-[#F44336] text-white";
}

export default function Documentos() {
  const [tab, setTab] = useState("Todos");
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tipo, setTipo] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [alerta, setAlerta] = useState({ mostrar: false, cantidad: 0 });
  const [tiposOpts, setTiposOpts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trabajadorId: "",
    tipo: "",
    emision: "",
    vencimiento: "",
    archivoNombre: "",
  });
  const [formErr, setFormErr] = useState({});

  const trabajadoresOpts = useMemo(() => listTrabajadoresParaSelect(), []);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await documentosService.getAll({
      tab,
      tipo,
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
  }, [tab, tipo, q, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setTiposOpts(documentosService.getTiposOpciones());
    (async () => {
      const a = await documentosService.getAlertaPorVencer();
      if (a.ok) setAlerta(a.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, q, estadoFiltro, tipo]);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const abrirCrear = () => {
    setEditing(null);
    setFormErr({});
    const t0 = tiposOpts[0] || "";
    setForm({
      trabajadorId: trabajadoresOpts[0] ? String(trabajadoresOpts[0].id) : "",
      tipo: t0,
      emision: "",
      vencimiento: "",
      archivoNombre: "",
    });
    setModalOpen(true);
  };

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
      trabajadorId: String(d.trabajadorId),
      tipo: d.tipo,
      emision: d.emision,
      vencimiento: d.vencimiento,
      archivoNombre: d.archivoUrl || "",
    });
    setModalOpen(true);
  };

  const validar = () => {
    const e = {};
    if (!form.trabajadorId) e.trabajadorId = "Obligatorio";
    if (!form.tipo.trim()) e.tipo = "Obligatorio";
    if (!form.emision) e.emision = "Obligatorio";
    if (!form.vencimiento) e.vencimiento = "Obligatorio";
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const onFile = (ev) => {
    const f = ev.target.files?.[0];
    setForm((prev) => ({ ...prev, archivoNombre: f ? f.name : "" }));
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const datos = {
      trabajadorId: Number(form.trabajadorId),
      tipo: form.tipo.trim(),
      emision: form.emision,
      vencimiento: form.vencimiento,
      archivoNombre: form.archivoNombre || undefined,
    };
    const res = editing
      ? await documentosService.update(editing.id, datos)
      : await documentosService.create(datos);
    setSaving(false);
    if (!res.ok) {
      setFlash({ type: "error", message: res.message });
      return;
    }
    setFlash({
      type: "ok",
      message: editing ? "Documento actualizado" : "Documento agregado",
    });
    setModalOpen(false);
    const a = await documentosService.getAlertaPorVencer();
    if (a.ok) setAlerta(a.data);
    await cargar();
  };

  const eliminar = async (row) => {
    if (!window.confirm(`¿Eliminar el documento de ${row.trabajador}?`)) return;
    setLoading(true);
    const res = await documentosService.remove(row.id);
    setLoading(false);
    if (!res.ok) setFlash({ type: "error", message: res.message });
    else {
      setFlash({ type: "ok", message: "Documento eliminado" });
      const a = await documentosService.getAlertaPorVencer();
      if (a.ok) setAlerta(a.data);
      await cargar();
    }
  };

  return (
    <>
      <TopBar
        right={(
          <button type="button" className="btn text-white" style={{ background: "#1565C0" }} onClick={abrirCrear}>
            <Plus className="w-4 h-4" /> Agregar Documento
          </button>
        )}
      />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de documentos del personal</h2>
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="flex gap-4 border-b flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pb-2 text-sm ${tab === t.key ? "border-b-2 border-blue-600 text-blue-700 font-medium" : "text-slate-500"}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {alerta.mostrar && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900 px-4 py-3 text-sm">
            Hay {alerta.cantidad} documento(s) por vencer en los próximos 30 días — revise fechas de vencimiento.
          </div>
        )}

        <div className="card card-body flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="">Estado</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Vencido</option>
          </select>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Tipo</option>
            {tiposOpts.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#1565C0]" />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trabajador</th>
                  <th>Tipo</th>
                  <th>Emisión</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Archivo</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, idx) => (
                  <tr key={d.id} className={idx % 2 ? "bg-slate-50/50" : ""}>
                    <td>{d.id}</td>
                    <td>{d.trabajador}</td>
                    <td>{d.tipo}</td>
                    <td>{fmtFecha(d.emision)}</td>
                    <td>{fmtFecha(d.vencimiento)}</td>
                    <td>
                      <span className={`badge border-0 ${badgeClass(d.estado)}`}>{d.estado}</span>
                    </td>
                    <td className="font-mono text-xs max-w-[10rem] truncate" title={d.archivoUrl}>{d.archivoUrl}</td>
                    <td className="flex gap-2">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => abrirEditar(d)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => eliminar(d)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar documento" : "Agregar documento"}
        size="lg"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1565C0" }} disabled={saving} onClick={guardar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? "Guardar" : "Agregar"}
            </button>
          </>
        )}
      >
        <form className="space-y-4" onSubmit={guardar}>
          <div>
            <label className="label">Trabajador</label>
            <select
              className="select"
              value={form.trabajadorId}
              onChange={(e) => setForm((f) => ({ ...f, trabajadorId: e.target.value }))}
            >
              {trabajadoresOpts.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {formErr.trabajadorId && <p className="text-xs text-red-600 mt-1">{formErr.trabajadorId}</p>}
          </div>
          <div>
            <label className="label">Tipo</label>
            <input className="input" list="tipos-doc" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} />
            <datalist id="tipos-doc">
              {tiposOpts.map((x) => <option key={x} value={x} />)}
            </datalist>
            {formErr.tipo && <p className="text-xs text-red-600 mt-1">{formErr.tipo}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha emisión</label>
              <input type="date" className="input" value={form.emision} onChange={(e) => setForm((f) => ({ ...f, emision: e.target.value }))} />
              {formErr.emision && <p className="text-xs text-red-600 mt-1">{formErr.emision}</p>}
            </div>
            <div>
              <label className="label">Fecha vencimiento</label>
              <input type="date" className="input" value={form.vencimiento} onChange={(e) => setForm((f) => ({ ...f, vencimiento: e.target.value }))} />
              {formErr.vencimiento && <p className="text-xs text-red-600 mt-1">{formErr.vencimiento}</p>}
            </div>
          </div>
          <div>
            <label className="label">Archivo (mock: solo nombre)</label>
            <input type="file" accept=".pdf,image/*" className="input text-sm" onChange={onFile} />
            {form.archivoNombre && <p className="text-xs text-slate-500 mt-1">Seleccionado: {form.archivoNombre}</p>}
          </div>
        </form>
      </Modal>
    </>
  );
}
