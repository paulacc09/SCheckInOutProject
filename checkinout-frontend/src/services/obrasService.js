/**
 * Mis Obras — CRUD en memoria.
 * Datos base en ./dataStore.js
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";
import { countActivosPorObraNombre } from "./personalService.js";

// TODO: reemplazar con lógica de agregación de GET /api/obras/:id/estadisticas
function porcentajeAsistenciaMock(nombreObra) {
  const activos = countActivosPorObraNombre(nombreObra);
  const regs = store.asistencias.filter(
    (a) => a.obra === nombreObra && a.fecha === "2026-04-11"
  );
  const conIngreso = regs.filter((a) => a.ingreso && String(a.ingreso).trim()).length;
  if (!activos) return 0;
  return Math.min(100, Math.round((conIngreso / Math.max(activos, 1)) * 100));
}

// TODO: reemplazar con mapper de respuesta de GET /api/obras
function enrich(obra) {
  const personal = countActivosPorObraNombre(obra.nombre);
  const presente = Number(obra.presente || 0);
  const asistSinJustificar = Math.max(0, personal - presente);
  const pendientes = Array.isArray(obra.pendientes) ? obra.pendientes : [];
  return {
    ...obra,
    personal,
    presente,
    asistSinJustificar,
    pendientes,
    trabajadoresActivos: personal,
    porcentajeAsistencia: porcentajeAsistenciaMock(obra.nombre),
    pendientesCount: pendientes.length,
  };
}

// TODO: reemplazar con GET /api/obras?search=&estado=
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", estado = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = store.obras.map(enrich);
  if (t) {
    rows = rows.filter(
      (o) =>
        `${o.nombre} ${o.ubicacion} ${o.encargado}`.toLowerCase().includes(t)
    );
  }
  if (estado) rows = rows.filter((o) => o.estado === estado);
  return ok(rows);
}

// TODO: reemplazar con GET /api/obras/:id
export async function getById(id) {
  await delay();
  const o = store.obras.find((x) => x.id === Number(id));
  if (!o) return fail("Obra no encontrada");
  return ok(enrich(o));
}

// TODO: reemplazar con GET /api/obras/:id/estadisticas
export async function getEstadisticas(id) {
  await delay();
  const r = await getById(id);
  if (!r.ok) return r;
  return ok({
    personal: r.data.personal,
    presente: r.data.presente,
    porcentajeAsistencia: r.data.porcentajeAsistencia,
    asistSinJustificar: r.data.asistSinJustificar,
    pendientesCount: r.data.pendientesCount,
    pendientes: r.data.pendientes,
  });
}

// TODO: reemplazar con POST /api/obras (body: nombre, ubicacion, encargado, fechaInicio, estado)
export async function create(datos) {
  await delay();
  const { nombre, codigo, ubicacion, encargado, fechaInicio, estado } = datos;
  if (!nombre?.trim() || !ubicacion?.trim()) {
    return fail("Nombre y ubicación son obligatorios");
  }
  if (store.obras.some((o) => o.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
    return fail("Ya existe una obra con ese nombre");
  }
  if (codigo && store.obras.some((o) => String(o.codigo).toLowerCase() === String(codigo).trim().toLowerCase())) {
    return fail("Ya existe una obra con ese código");
  }
  const id = store.nextIds.obra++;
  const autoCodigo = String(8000 + id).padStart(5, "0");
  const row = {
    id,
    codigo: codigo?.trim() || autoCodigo,
    nombre: nombre.trim(),
    ubicacion: ubicacion.trim(),
    encargado: encargado || "Por definir",
    fechaInicio: fechaInicio || new Date().toISOString().slice(0, 10),
    estado: estado || "activa",
    presente: 0,
    pendientes: [],
  };
  store.obras.push(row);
  return ok(enrich(row));
}

// TODO: reemplazar con PUT /api/obras/:id
export async function update(id, datos) {
  await delay();
  const idx = store.obras.findIndex((o) => o.id === Number(id));
  if (idx === -1) return fail("Obra no encontrada");
  const nombre = datos.nombre?.trim() ?? store.obras[idx].nombre;
  const codigo = datos.codigo?.trim() ?? store.obras[idx].codigo;
  if (
    store.obras.some(
      (o, i) => i !== idx && o.nombre.toLowerCase() === nombre.toLowerCase()
    )
  ) {
    return fail("Ya existe otra obra con ese nombre");
  }
  if (store.obras.some((o, i) => i !== idx && String(o.codigo).toLowerCase() === String(codigo).toLowerCase())) {
    return fail("Ya existe otra obra con ese código");
  }
  store.obras[idx] = {
    ...store.obras[idx],
    ...datos,
    id: Number(id),
    codigo,
    nombre,
    ubicacion: datos.ubicacion?.trim() ?? store.obras[idx].ubicacion,
    encargado: datos.encargado ?? store.obras[idx].encargado,
    fechaInicio: datos.fechaInicio ?? store.obras[idx].fechaInicio,
    estado: datos.estado ?? store.obras[idx].estado,
  };
  return ok(enrich(store.obras[idx]));
}

// TODO: reemplazar con DELETE /api/obras/:id (validar que no tenga trabajadores activos)
export async function remove(id) {
  await delay();
  const o = store.obras.find((x) => x.id === Number(id));
  if (!o) return fail("Obra no encontrada");
  store.obras = store.obras.filter((x) => x.id !== Number(id));
  return ok(o);
}

/** Opciones de encargado: usuarios mock con rol Encargado */
// TODO: reemplazar con GET /api/usuarios?rol=Encargado
export async function getEncargadosOpciones() {
  await delay();
  return ok(
    store.usuarios
      .filter((u) => u.rol === "Encargado")
      .map((u) => ({ value: u.nombre, label: u.nombre }))
  );
}

// TODO: reemplazar con GET /api/obras/options
export async function getNombresObras() {
  await delay();
  return ok(store.obras.map((o) => o.nombre));
}
