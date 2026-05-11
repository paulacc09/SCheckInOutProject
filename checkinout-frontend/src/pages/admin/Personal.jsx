import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Loader2, Pencil, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import CamaraFacial from "../../components/CamaraFacial";
import PaginationBar from "../../components/PaginationBar";
import { paginate } from "../../services/pagination";

const PAGE_SIZE = 10;

export default function Personal() {
  const nombreApellidoRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/;
  const cedulaRegex = /^\d{5,15}$/;
  const telefonoRegex = /^\d{7,15}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const tiposDocumentoValidos = ["CC", "CE", "Pasaporte", "TI", "PEP"];
  const sexosValidos = ["M", "F", "Otro"];

  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [subcargos, setSubcargos] = useState([]);
  const [obras, setObras] = useState([]);
  const [form, setForm] = useState({
    nombre: "", apellido: "", cedula: "", telefono: "",
    email: "", subcargo_id: "", estado: "activo",
    tipo_documento: "CC", fecha_nacimiento: "", sexo: "",     obra_id: "",
  });
  const [mostrarBiometrico, setMostrarBiometrico] = useState(false);
  const [trabajadorNuevoId, setTrabajadorNuevoId] = useState(null);

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = form.nombre.trim();
    const apellidoLimpio = form.apellido.trim();
    const cedulaLimpia = form.cedula.trim();
    const telefonoLimpio = form.telefono.trim();
    const emailLimpio = form.email.trim();
    const fechaNacimientoLimpia = form.fecha_nacimiento.trim();

    if (!nombreApellidoRegex.test(nombreLimpio)) {
      nuevosErrores.nombre = "El nombre debe tener 2 a 50 caracteres y solo letras y espacios.";
    }
    if (!nombreApellidoRegex.test(apellidoLimpio)) {
      nuevosErrores.apellido = "El apellido debe tener 2 a 50 caracteres y solo letras y espacios.";
    }
    if (!cedulaRegex.test(cedulaLimpia)) {
      nuevosErrores.cedula = "La cédula debe tener solo números y entre 5 y 15 dígitos.";
    }
    if (telefonoLimpio && !telefonoRegex.test(telefonoLimpio)) {
      nuevosErrores.telefono = "El teléfono debe tener solo números y entre 7 y 15 dígitos.";
    }
    if (emailLimpio && !emailRegex.test(emailLimpio)) {
      nuevosErrores.email = "El correo debe tener un formato válido.";
    }
    if (!tiposDocumentoValidos.includes(form.tipo_documento)) {
      nuevosErrores.tipo_documento = "El tipo de documento debe ser CC, CE, Pasaporte, TI o PEP.";
    }
    if (fechaNacimientoLimpia) {
      const fechaNacimiento = new Date(`${fechaNacimientoLimpia}T00:00:00`);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (Number.isNaN(fechaNacimiento.getTime())) {
        nuevosErrores.fecha_nacimiento = "La fecha de nacimiento no es válida.";
      } else if (fechaNacimiento > hoy) {
        nuevosErrores.fecha_nacimiento = "La fecha de nacimiento no puede ser futura.";
      }
    }
    if (form.sexo && !sexosValidos.includes(form.sexo)) {
      nuevosErrores.sexo = "El sexo debe ser M, F u Otro.";
    }

    return nuevosErrores;
  };

  const onFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: "" };
    });
  };

  const cargarOpcionesModal = async () => {
    try {
      const [{ data: subcargosData }, { data: obrasData }] = await Promise.all([
        api.get("/subcargos"),
        api.get("/obras"),
      ]);
      setSubcargos(subcargosData.subcargos || subcargosData.data || subcargosData || []);
      setObras(obrasData.obras || obrasData.data || obrasData || []);
    } catch {
      setSubcargos([]);
      setObras([]);
    }
  };

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/trabajadores");
      setTrabajadores(Array.isArray(data) ? data : data.trabajadores ?? data.data?.trabajadores ?? data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cargar el personal");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = async () => {
    setEditing(null);
    setErrores({});
    await cargarOpcionesModal();
    setForm({
      nombre: "", apellido: "", cedula: "", telefono: "", email: "",
      subcargo_id: "", estado: "activo", tipo_documento: "CC",
      fecha_nacimiento: "", sexo: "", obra_id: "",
    });
    setOpenModal(true);
  };
  const abrirEditar = async (t) => {
    setEditing(t);
    setErrores({});
    await cargarOpcionesModal();
    setForm({
      nombre: t.nombre || "", apellido: t.apellido || "", cedula: t.cedula || "",
      telefono: t.telefono || "", email: t.email || "",
      subcargo_id: t.subcargo_id || "", estado: t.estado || "activo",
      tipo_documento: t.tipo_documento || "CC",
      fecha_nacimiento: t.fecha_nacimiento ? String(t.fecha_nacimiento).slice(0, 10) : "",
      sexo: t.sexo || "",
      obra_id: t.obra_id || "",
    });
    setOpenModal(true);
  };

  const onGuardar = async (e) => {
    e.preventDefault();
    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        const updatePayload = {
          ...form,
          estado: (form.estado || "activo").toLowerCase(),
        };
        await api.put(`/trabajadores/${editing.id}`, updatePayload);
        setOpenModal(false);
        await cargar();
      } else {
        const { data: resp } = await api.post("/trabajadores", form);
        const nuevoId = resp.data?.id || resp.id;
        setTrabajadorNuevoId(nuevoId);
        setOpenModal(false);
        setMostrarBiometrico(true);
        await cargar();
        setSaving(false);
        return;
      }
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al guardar trabajador");
    } finally {
      setSaving(false);
    }
  };

  const filtrados = trabajadores.filter((t) => {
    const txt = q.toLowerCase();
    const okQ = !txt ||
      `${t.nombre} ${t.apellido}`.toLowerCase().includes(txt) ||
      (t.cedula || "").toLowerCase().includes(txt);
    const okEstado = !estado || t.estado === estado;
    return okQ && okEstado;
  });

  useEffect(() => {
    setPage(1);
  }, [q, estado]);

  const { items: filas, totalPages, page: safePage } = useMemo(
    () => paginate(filtrados, page, PAGE_SIZE),
    [filtrados, page, PAGE_SIZE]
  );

  return (
    <>
      <TopBar
        title="Gestión Personal"
        subtitle="Administra los trabajadores de tu empresa"
        right={<button onClick={abrirCrear} className="btn btn-primary"><Plus className="w-4 h-4" /> Registrar Trabajador</button>}
      />
      <div className="p-6 space-y-4">
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Buscar por nombre o cédula…" />
          </div>
          <select className="select sm:w-40" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> {error}</div>
        ) : filtrados.length === 0 ? (
          <div className="card">
            <EmptyState title="Sin trabajadores" message="Aún no has registrado personal." action={
              <button onClick={abrirCrear} className="btn btn-primary"><Plus className="w-4 h-4" /> Registrar trabajador</button>
            }/>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Obra</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((t) => (
                    <tr key={t.id}>
                      <td className="text-slate-500">{t.id}</td>
                      <td className="font-medium text-slate-800">{t.nombre} {t.apellido}</td>
                      <td className="font-mono text-xs">{t.cedula}</td>
                      <td className="text-slate-600">{t.subcargo || t.subcargo_nombre || t.cargo || "—"}</td>
                      <td className="text-slate-600">{t.obra_nombre || "—"}</td>
                      <td>
                        <span className={t.estado === "activo" ? "badge badge-success" : "badge badge-muted"}>
                          {t.estado}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Editar">
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </button>
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
        open={openModal}
        onClose={() => {
          setErrores({});
          setOpenModal(false);
        }}
        title={editing ? "Editar trabajador" : "Registrar trabajador"}
        size="lg"
        footer={
          <>
            <button onClick={() => {
              setErrores({});
              setOpenModal(false);
            }} className="btn btn-outline">Cancelar</button>
            <button onClick={onGuardar} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? "Guardar cambios" : "Registrar"}
            </button>
          </>
        }
      >
        <form onSubmit={onGuardar} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div className="sm:col-span-3">
            <label className="label">Nombres</label>
            <input className="input" required value={form.nombre} onChange={(e) => onFieldChange("nombre", e.target.value)} />
            {errores.nombre && <p className="text-xs text-red-600 mt-1">{errores.nombre}</p>}
          </div>
          <div className="sm:col-span-3">
            <label className="label">Apellidos</label>
            <input className="input" required value={form.apellido} onChange={(e) => onFieldChange("apellido", e.target.value)} />
            {errores.apellido && <p className="text-xs text-red-600 mt-1">{errores.apellido}</p>}
          </div>
          <div className="sm:col-span-3">
            <label className="label">Tipo documento</label>
            <select className="select" value={form.tipo_documento} onChange={(e) => onFieldChange("tipo_documento", e.target.value)}>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="TI">TI</option>
              <option value="PEP">PEP</option>
            </select>
            {errores.tipo_documento && <p className="text-xs text-red-600 mt-1">{errores.tipo_documento}</p>}
          </div>
          <div className="sm:col-span-3">
            <label className="label">N° documento</label>
            <input className="input" required value={form.cedula} onChange={(e) => onFieldChange("cedula", e.target.value)} />
            {errores.cedula && <p className="text-xs text-red-600 mt-1">{errores.cedula}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => onFieldChange("telefono", e.target.value)} />
            {errores.telefono && <p className="text-xs text-red-600 mt-1">{errores.telefono}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Fecha de nacimiento</label>
            <input type="date" className="input" value={form.fecha_nacimiento} onChange={(e) => onFieldChange("fecha_nacimiento", e.target.value)} />
            {errores.fecha_nacimiento && <p className="text-xs text-red-600 mt-1">{errores.fecha_nacimiento}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Sexo</label>
            <select className="select" value={form.sexo} onChange={(e) => onFieldChange("sexo", e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
            {errores.sexo && <p className="text-xs text-red-600 mt-1">{errores.sexo}</p>}
          </div>
          <div className="sm:col-span-6">
            <label className="label">Correo</label>
            <input type="email" className="input" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} />
            {errores.email && <p className="text-xs text-red-600 mt-1">{errores.email}</p>}
          </div>
          <div className="sm:col-span-6">
            <label className="label">Asignación y cargo</label>
          </div>
          <div className="sm:col-span-3">
            <label className="label">Cargo</label>
            <select className="select" value={form.subcargo_id} onChange={(e) => onFieldChange("subcargo_id", e.target.value)}>
              <option value="">Seleccionar cargo</option>
              {subcargos.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="label">Obra</label>
            <select className="select" value={form.obra_id} onChange={(e) => onFieldChange("obra_id", e.target.value)}>
              <option value="">Seleccionar obra</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
          </div>
          {editing && (
            <div className="sm:col-span-3">
              <label className="label">Estado</label>
              <select className="select" value={form.estado} onChange={(e) => onFieldChange("estado", e.target.value)}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select>
            </div>
          )}
        </form>
      </Modal>

      {mostrarBiometrico && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Registrar rostro del trabajador</h2>
            <p className="text-sm text-slate-500">Capture el rostro del trabajador para habilitar el control de asistencia biométrico.</p>
            <CamaraFacial
              modo="registrar"
              onDescriptor={async (descriptor) => {
                try {
                  await api.patch(`/trabajadores/${trabajadorNuevoId}/descriptor`, { descriptor });
                  alert("Rostro registrado exitosamente ✅");
                } catch {
                  alert("Error al guardar el descriptor facial");
                } finally {
                  setMostrarBiometrico(false);
                  setTrabajadorNuevoId(null);
                }
              }}
              onCerrar={() => {
                setMostrarBiometrico(false);
                setTrabajadorNuevoId(null);
              }}
            />
            <button
              onClick={() => {
                setMostrarBiometrico(false);
                setTrabajadorNuevoId(null);
              }}
              className="btn btn-outline w-full"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      )}
    </>
  );
}
