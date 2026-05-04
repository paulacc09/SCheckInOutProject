/**
 * Mis Obras — CRUD en memoria.
 * Datos base en ./dataStore.js
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";
import { countActivosPorObraNombre } from "./personalService.js";

function porcentajeAsistenciaMock(nombreObra) {
  const activos = countActivosPorObraNombre(nombreObra);
  const regs = store.asistencias.filter((a) => a.obra === nombreObra);
  const conIngreso = regs.filter((a) => a.ingreso && String(a.ingreso).trim()).length;
  if (!activos) return 0;
  return Math.min(100, Math.round((conIngreso / Math.max(activos, 1)) * 100));
}

function enrich(obra) {
  return {
    ...obra,
    trabajadoresActivos: countActivosPorObraNombre(obra.nombre),
    porcentajeAsistencia: porcentajeAsistenciaMock(obra.nombre),
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
    trabajadoresActivos: r.data.trabajadoresActivos,
    porcentajeAsistencia: r.data.porcentajeAsistencia,
  });
}

// TODO: reemplazar con POST /api/obras (body: nombre, ubicacion, encargado, fechaInicio, estado)
export async function create(datos) {
  await delay();
  const { nombre, ubicacion, encargado, fechaInicio, estado } = datos;
  if (!nombre?.trim() || !ubicacion?.trim() || !encargado || !fechaInicio) {
    return fail("Nombre, ubicación, encargado y fecha de inicio son obligatorios");
  }
  if (store.obras.some((o) => o.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
    return fail("Ya existe una obra con ese nombre");
  }
  const id = store.nextIds.obra++;
  const row = {
    id,
    nombre: nombre.trim(),
    ubicacion: ubicacion.trim(),
    encargado,
    fechaInicio,
    estado: estado || "activa",
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
  if (
    store.obras.some(
      (o, i) => i !== idx && o.nombre.toLowerCase() === nombre.toLowerCase()
    )
  ) {
    return fail("Ya existe otra obra con ese nombre");
  }
  store.obras[idx] = {
    ...store.obras[idx],
    ...datos,
    id: Number(id),
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
  const activos = countActivosPorObraNombre(o.nombre);
  if (activos > 0) {
    return fail(
      `No se puede eliminar: hay ${activos} trabajador(es) activo(s) asignado(s) a esta obra`
    );
  }
  store.obras = store.obras.filter((x) => x.id !== Number(id));
  return ok(o);
}

/** Opciones de encargado: usuarios mock con rol Encargado */
export async function getEncargadosOpciones() {
  await delay();
  return ok(
    store.usuarios
      .filter((u) => u.rol === "Encargado")
      .map((u) => ({ value: u.nombre, label: u.nombre }))
  );
}

export async function getNombresObras() {
  await delay();
  return ok(store.obras.map((o) => o.nombre));
}
