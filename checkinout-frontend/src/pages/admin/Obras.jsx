import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import PaginationBar from "../../components/PaginationBar";
import FlashBanner from "../../components/FlashBanner";
import SortTh from "../../components/SortTh";
import { useSortable } from "../../hooks/useSortable";
import { paginate } from "../../services/pagination";

const PAGE_SIZE = 8;

function badgeObra(estado) {
  if (estado === "activa") return "bg-[#dcfce7] text-[#16a34a]";
  if (estado === "suspendida") return "bg-[#fef3c7] text-[#b45309]";
  return "bg-[#f3f4f6] text-[#6b7280]";
}

export default function Obras() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [inspectores, setInspectores] = useState([]);
  const [stats, setStats] = useState({ trabajadoresActivos: 0, asistenciaHoy: 0, pendientes: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState({});
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    ciudad: "",
    direccion: "",
    fecha_inicio: "",
    fecha_fin: "",
    responsable_sst_id: "",
    estado: "activa",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const { data } = await api.get("/obras");
      setRows(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setFlash({ type: "error", message: e.response?.data?.message || "No se pudieron cargar las obras" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarStats = useCallback(async () => {
    try {
      const { data } = await api.get("/obras/stats");
      setStats(data.data ?? data);
    } catch {
    }
  }, []);

  const cargarInspectores = async () => {
    try {
      const { data } = await api.get("/usuarios?rol=inspector_sst");
      setInspectores(Array.isArray(data) ? data : data.data ?? data.usuarios ?? []);
    } catch {
      setInspectores([]);
    }
  };

  useEffect(() => {
    cargar();
    cargarStats();
  }, [cargar, cargarStats]);

  useEffect(() => {
    setPage(1);
  }, [q, estado, ciudad]);

  const filteredRows = useMemo(() => {
    const qt = q.trim().toLowerCase();
    const ct = ciudad.trim().toLowerCase();
    return rows.filter((o) => {
      const okQ =
        !qt ||
        (o.nombre || "").toLowerCase().includes(qt) ||
        (o.codigo || "").toLowerCase().includes(qt);
      const okEstado = !estado || o.estado === estado;
      const okCiudad = !ct || (o.ciudad || "").toLowerCase().includes(ct);
      return okQ && okEstado && okCiudad;
    });
  }, [rows, q, estado, ciudad]);

  const { sorted, sortCol, sortDir, toggle } = useSortable(filteredRows);

  const { items: pageRows, totalPages, page: safePage } = useMemo(
    () => paginate(sorted, page, PAGE_SIZE),
    [sorted, page]
  );

  const openCreate = async () => {
    setEditingId(null);
    setFormErr({});
    await cargarInspectores();
    setForm({
      codigo: "",
      nombre: "",
      ciudad: "",
      direccion: "",
      fecha_inicio: "",
      fecha_fin: "",
      responsable_sst_id: "",
      estado: "activa",
    });
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    setEditingId(row.id);
    setFormErr({});
    await cargarInspectores();
    setForm({
      codigo: row.codigo || "",
      nombre: row.nombre || "",
      ciudad: row.ciudad || "",
      direccion: row.direccion || "",
      fecha_inicio: row.fecha_inicio ? String(row.fecha_inicio).slice(0, 10) : "",
      fecha_fin: row.fecha_fin ? String(row.fecha_fin).slice(0, 10) : "",
      responsable_sst_id: row.responsable_sst_id || "",
      estado: row.estado || "activa",
    });
    setModalOpen(true);
  };

  const validate = () => {
    const err = {};
    if (!form.codigo.trim()) err.codigo = "El código es obligatorio";
    if (!form.nombre.trim()) err.nombre = "El nombre es obligatorio";
    setFormErr(err);
    return Object.keys(err).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setFlash(null);
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      ciudad: form.ciudad?.trim() || null,
      direccion: form.direccion?.trim() || null,
      fecha_inicio: form.fecha_inicio?.trim() || null,
      fecha_fin: form.fecha_fin?.trim() || null,
      responsable_sst_id: form.responsable_sst_id || null,
    };
    try {
      let obraId = editingId;
      if (editingId) {
        await api.put(`/obras/${editingId}`, payload);
      } else {
        const { data: res } = await api.post("/obras", payload);
        obraId = res.data?.id ?? res.id;
      }
      if (obraId != null) {
        await api.patch(`/obras/${obraId}/estado`, { estado: form.estado });
      }
      setModalOpen(false);
      setFlash({ type: "ok", message: editingId ? "Obra actualizada" : "Obra creada" });
      await cargar();
    } catch (err) {
      setFlash({
        type: "error",
        message: err.response?.data?.message || "No se pudo guardar la obra",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar
        title="Mis Obras"
        right={
          <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} onClick={openCreate}>
            <Plus className="w-4 h-4" /> Crear Obra
          </button>
        }
      />
      <div className="p-6 space-y-4 bg-[#f5f6fa] min-h-full">
        {flash && <FlashBanner type={flash.type === "error" ? "error" : "ok"} message={flash.message} onClose={() => setFlash(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="card card-body"><p className="text-sm text-slate-500">Trabajadores activos</p><p className="text-2xl font-bold text-[#1e3a6e]">{stats.trabajadoresActivos}</p></div><div className="card card-body"><p className="text-sm text-slate-500">Asistencia hoy</p><p className="text-2xl font-bold text-[#1e3a6e]">{stats.asistenciaHoy}</p></div><div className="card card-body"><p className="text-sm text-slate-500">Novedades pendientes</p><p className="text-2xl font-bold text-[#1e3a6e]">{stats.pendientes}</p></div></div>

        <div className="card card-body flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código…"
            />
          </div>
          <input
            className="input sm:w-44"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ciudad"
          />
          <select className="select sm:w-48" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activa">activa</option>
            <option value="finalizada">finalizada</option>
            <option value="suspendida">suspendida</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a6e]" />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <SortTh col="codigo" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    CÓDIGO
                  </SortTh>
                  <SortTh col="nombre" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    NOMBRE
                  </SortTh>
                  <SortTh col="ciudad" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    CIUDAD
                  </SortTh>
                  <SortTh col="direccion" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    DIRECCIÓN
                  </SortTh>
                  <SortTh col="estado" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    ESTADO
                  </SortTh>
                  <SortTh col="personal" sortCol={sortCol} sortDir={sortDir} onSort={toggle}>
                    PERSONAL
                  </SortTh>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-sm">{o.codigo}</td>
                    <td>{o.nombre}</td>
                    <td>{o.ciudad ?? "—"}</td>
                    <td>{o.direccion ?? "—"}</td>
                    <td>
                      <span className={`badge ${badgeObra(o.estado)}`}>{o.estado}</span>
                    </td>
                    <td>{o.personal ?? 0}</td>
                    <td>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100" onClick={() => openEdit(o)} title="Editar">
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && sorted.length > 0 && (
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Obra" : "Crear Nueva Obra"}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn text-white" style={{ background: "#1e3a6e" }} disabled={saving} onClick={save}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Guardar cambios" : "Crear Obra"}
            </button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="label">Código de obra</label>
            <input className="input" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
            {formErr.codigo && <p className="text-xs text-red-600 mt-1">{formErr.codigo}</p>}
          </div>
          <div>
            <label className="label">Nombre de la obra</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {formErr.nombre && <p className="text-xs text-red-600 mt-1">{formErr.nombre}</p>}
          </div>
          <div>
            <label className="label">Dirección/Ubicación</label>
            <input className="input" value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input className="input" value={form.ciudad} onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))} />
          </div>
          <div>
            <label className="label">Inspector SST (opcional)</label>
            <select className="select" value={form.responsable_sst_id} onChange={(e) => setForm((f) => ({ ...f, responsable_sst_id: e.target.value }))}>
              <option value="">Sin asignar</option>
              {inspectores.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre} {i.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="select" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option value="activa">activa</option>
              <option value="finalizada">finalizada</option>
              <option value="suspendida">suspendida</option>
            </select>
          </div>
          <div>
            <label className="label">Fecha inicio</label>
            <input type="date" className="input" value={form.fecha_inicio} onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input type="date" className="input" value={form.fecha_fin} onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </>
  );
}
