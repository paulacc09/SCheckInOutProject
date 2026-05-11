import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

const pendientes = [
  { id: 1, tipo: "Médico", titulo: "Permiso Médico", trabajador: "Julio Sanchez", obra: "Mandarino" },
  { id: 2, tipo: "Asistencia", titulo: "Nueva Asistencia Registrada", trabajador: null, obra: "Edificio Torre Central" },
  { id: 3, tipo: "Dispositivo", titulo: "Nuevo Dispositivo Ingresado", trabajador: null, obra: "Conjunto Residencial Norte" },
];

function normalEstado(estado) {
  return String(estado || "").toLowerCase();
}

// TODO: reemplazar con GET /api/obras?estado=X&search=Y
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", estado = "" } = filtros;
  const q = String(search).trim().toLowerCase();
  let rows = [...store.obras];
  if (q) {
    rows = rows.filter((o) => `${o.id} ${o.nombre} ${o.ubicacion}`.toLowerCase().includes(q));
  }
  if (estado) {
    rows = rows.filter((o) => normalEstado(o.estado) === normalEstado(estado));
  }
  return ok(rows);
}

// TODO: reemplazar con GET /api/obras/:id
export async function getById(id) {
  await delay();
  const row = store.obras.find((o) => o.id === id);
  if (!row) return fail("Obra no encontrada");
  return ok({ ...row });
}

// TODO: reemplazar con POST /api/obras
export async function create(datos) {
  await delay();
  const { id, nombre, ubicacion, estado = "activa" } = datos;
  if (!nombre?.trim()) return fail("El nombre es obligatorio");
  if (!ubicacion?.trim()) return fail("La ubicación es obligatoria");
  if (!id?.trim()) return fail("ID de obra inválido");
  if (store.obras.some((o) => o.id.toLowerCase() === id.trim().toLowerCase())) {
    return fail("Ya existe una obra con ese ID");
  }
  const nueva = {
    id: id.trim(),
    nombre: nombre.trim(),
    ubicacion: ubicacion.trim(),
    estado: normalEstado(estado) || "activa",
    personal: 0,
    presente: 0,
  };
  store.obras.unshift(nueva);
  return ok(nueva);
}

// TODO: reemplazar con PUT /api/obras/:id
export async function update(id, datos) {
  await delay();
  const idx = store.obras.findIndex((o) => o.id === id);
  if (idx === -1) return fail("Obra no encontrada");
  const nextId = (datos.id ?? store.obras[idx].id).trim();
  if (!datos.nombre?.trim()) return fail("El nombre es obligatorio");
  if (!datos.ubicacion?.trim()) return fail("La ubicación es obligatoria");
  if (store.obras.some((o, i) => i !== idx && o.id.toLowerCase() === nextId.toLowerCase())) {
    return fail("Ya existe una obra con ese ID");
  }
  store.obras[idx] = {
    ...store.obras[idx],
    id: nextId,
    nombre: datos.nombre.trim(),
    ubicacion: datos.ubicacion.trim(),
    estado: normalEstado(datos.estado) || "activa",
  };
  return ok(store.obras[idx]);
}

// TODO: reemplazar con DELETE /api/obras/:id
export async function remove(id) {
  await delay();
  const idx = store.obras.findIndex((o) => o.id === id);
  if (idx === -1) return fail("Obra no encontrada");
  const [deleted] = store.obras.splice(idx, 1);
  return ok(deleted);
}

// TODO: reemplazar con GET /api/obras/next-id
export function getNextObraId() {
  const numeric = store.obras
    .map((o) => Number(String(o.id).replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = (numeric.length ? Math.max(...numeric) : 8005) + 1;
  return String(next).padStart(5, "0");
}

// TODO: reemplazar con GET /api/obras/stats/globales
export async function getGlobalStats() {
  await delay();
  const activos = store.personal.filter((p) => String(p.estado).toLowerCase() === "activo").length;
  const hoy = new Date().toLocaleDateString("es-CO");
  const presentesHoy = store.asistencias.filter((a) => a.fecha === hoy && a.estado === "Presente").length;
  const asistenciaPromedio = activos ? Math.round((presentesHoy / activos) * 100) : 0;
  const sinJustificar = store.asistencias.filter((a) => a.estado === "Ausente" && !a.justificacion).length;
  return ok({
    trabajadoresActivos: activos,
    asistenciaPromedio,
    asistenciasSinJustificar: sinJustificar,
    pendientes: pendientes.length,
  });
}

// TODO: reemplazar con GET /api/obras/pendientes?tipo=&obra=
export async function getPendientes(filtros = {}) {
  await delay();
  const { tipo = "Todos", obra = "Todas" } = filtros;
  let rows = [...pendientes];
  if (tipo !== "Todos") rows = rows.filter((p) => p.tipo === tipo);
  if (obra !== "Todas") rows = rows.filter((p) => p.obra === obra);
  return ok(rows);
}

// TODO: reemplazar con GET /api/obras/options
export async function getNombresObras() {
  await delay();
  return ok(store.obras.map((o) => o.nombre));
}
