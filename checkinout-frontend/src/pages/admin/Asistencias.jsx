import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import { paginate } from "../../services/pagination";
import * as asistenciasService from "../../services/asistenciasService";
import { getNombresObras } from "../../services/obrasService";
import { listTrabajadoresParaSelect } from "../../services/personalService";
import { store } from "../../services/dataStore";

const PAGE_SIZE = 10;

function badgeClass(estado) {
  if (estado === "Salida") return "bg-[#fee2e2] text-[#dc2626]";
  if (estado === "Presente") return "bg-[#dcfce7] text-[#16a34a]";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

export default function Asistencias() {
  const [q, setQ] = useState("");
  const [obra, setObra] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [obrasOpts, setObrasOpts] = useState([]);
  const [flash, setFlash] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const cargar = useCallback(async () => {
    const res = await asistenciasService.getAll({ search: q, obra, fecha, tipo, estado });
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setRows(res.data);
  }, [q, obra, fecha, tipo, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    (async () => {
      const r = await getNombresObras();
      if (r.ok) setObrasOpts(r.data);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, obra, fecha, tipo, estado]);

  const activosEmpresa = useMemo(
    () => store.personal.filter((p) => String(p.estado).toLowerCase() === "activo").length,
    []
  );
  const asistenciaDia = useMemo(() => {
    const presentes = rows.filter((r) => r.estado === "Presente").length;
    return activosEmpresa ? Math.round((presentes / activosEmpresa) * 100) : 0;
  }, [rows, activosEmpresa]);
  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(rows, page, PAGE_SIZE),
    [rows, page]
  );

  const trabajadores = listTrabajadoresParaSelect();
  const openEdit = async (row) => {
    const res = await asistenciasService.getById(row.id);
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setForm({ ...res.data });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await asistenciasService.update(form.id, form);
    setSaving(false);
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setModalOpen(false);
    setFlash({ type: "ok", message: "Registro actualizado" });
    await cargar();
  };

  const removeRow = async (row) => {
    if (!window.confirm("¿Eliminar este registro de asistencia?")) return;
    const res = await asistenciasService.remove(row.id);
    if (!res.ok) return setFlash({ type: "error", message: res.message });
    setFlash({ type: "ok", message: "Registro eliminado" });
    await cargar();
  };

  return (
    <>
      <TopBar title="Gestión Asistencias" />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{asistenciaDia}%</div>
            <div className="text-sm text-slate-500">Asistencia del día</div>
          </div>
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{activosEmpresa}</div>
            <div className="text-sm text-slate-500">Activos (empresa)</div>
          </div>
        </div>

        <div className="card card-body grid lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" />
          </div>
          <input type="text" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} placeholder="Fecha (dd/mm/yyyy)" />
          <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>
            <option value="">Obra</option>
            {obrasOpts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Tipo registro</option>
            <option value="Normal">Normal</option>
            <option value="Permiso">Permiso</option>
            <option value="Incapacidad">Incapacidad</option>
          </select>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="Salida">Salida</option>
            <option value="Presente">Presente</option>
            <option value="Ausente">Ausente</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="card card-body text-center text-slate-500">No hay asistencias que coincidan con los filtros seleccionados</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Obra</th>
                    <th>Fecha</th>
                    <th>Ingreso</th>
                    <th>Salida</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.nombre}</td>
                      <td>{r.obra}</td>
                      <td>{r.fecha}</td>
                      <td>{r.ingreso || "--"}</td>
                      <td>{r.salida || "--"}</td>
                      <td><span className={`badge ${badgeClass(r.estado)}`}>{r.estado}</span></td>
                      <td className="flex gap-2">
                        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => openEdit(r)}><Pencil className="w-4 h-4 text-slate-600" /></button>
                        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => removeRow(r)}><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar asistencia"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} disabled={saving} onClick={save}>Guardar</button>
          </>
        }
      >
        {form && (
          <form className="space-y-3" onSubmit={save}>
            <div>
              <label className="label">Trabajador</label>
              <div className="input bg-slate-50">
                {trabajadores.find((t) => t.id === form.trabajadorId)?.nombre || form.nombre}
              </div>
            </div>
            <div>
              <label className="label">Obra</label>
              <select className="select" value={form.obra} onChange={(e) => setForm((f) => ({ ...f, obra: e.target.value }))}>
                {obrasOpts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="text" className="input" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Hora Ingreso</label>
                <input type="time" className="input" value={form.ingreso || ""} onChange={(e) => setForm((f) => ({ ...f, ingreso: e.target.value }))} />
              </div>
              <div>
                <label className="label">Hora Salida</label>
                <input type="time" className="input" value={form.salida || ""} onChange={(e) => setForm((f) => ({ ...f, salida: e.target.value }))} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select className="select" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="Normal">Normal</option>
                  <option value="Permiso">Permiso</option>
                  <option value="Incapacidad">Incapacidad</option>
                </select>
              </div>
              <div>
                <label className="label">Estado</label>
                <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
                  <option value="Presente">Presente</option>
                  <option value="Salida">Salida</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
