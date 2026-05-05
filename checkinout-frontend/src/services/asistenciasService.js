/**
 * Asistencias — CRUD en memoria.
 * Datos en ./dataStore.js (trabajadorId enlaza con personal).
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

// TODO: reemplazar con reglas de negocio del backend en POST/PUT /api/asistencias
function inferirEstado({ ingreso, salida, estadoManual }) {
  if (estadoManual && ["Presente", "Ausente", "Salida"].includes(estadoManual)) {
    return estadoManual;
  }
  const ing = ingreso && String(ingreso).trim();
  const sal = salida && String(salida).trim();
  if (!ing) return "Ausente";
  if (!sal) return "Presente";
  return "Salida";
}

// TODO: reemplazar con GET /api/asistencias/stats
function statsFrom(list) {
  const hoy = "2026-04-11";
  const hoyRows = list.filter((r) => r.fecha === hoy);
  const presentesHoy = hoyRows.filter((r) => r.estado !== "Ausente").length;
  const esperadoHoy = Math.max(hoyRows.length, 1);
  const asistenciaDia = Math.round((presentesHoy / esperadoHoy) * 100);
  const activosEmpresa = store.personal.filter((p) => p.estado === "activo").length;
  return {
    asistenciaDia,
    activosEmpresa,
    total: list.length,
  };
}

// TODO: reemplazar con GET /api/asistencias?obra=&fecha=&estado=&search=
export async function getAll(filtros = {}) {
  await delay();
  const { obra = "", fecha = "", estado = "", tipo = "", search = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = store.asistencias.map((r) => ({
    ...r,
    salidaDisplay: r.salida && String(r.salida).trim() ? r.salida : "",
  }));
  if (t) rows = rows.filter((r) => r.nombre.toLowerCase().includes(t));
  if (obra) rows = rows.filter((r) => r.obra === obra);
  if (fecha) rows = rows.filter((r) => r.fecha === fecha);
  if (estado) rows = rows.filter((r) => r.estado === estado);
  if (tipo) rows = rows.filter((r) => r.tipo === tipo);
  return ok({ rows, stats: statsFrom(rows) });
}

// TODO: reemplazar con GET /api/asistencias/:id
export async function getById(id) {
  await delay();
  const r = store.asistencias.find((x) => x.id === Number(id));
  if (!r) return fail("Registro no encontrado");
  return ok({ ...r });
}

// TODO: reemplazar con POST /api/asistencias
export async function create(datos) {
  await delay();
  const {
    trabajadorId,
    obra,
    fecha,
    ingreso,
    salida,
    tipo = "Normal",
    estado: estadoManual,
  } = datos;
  if (!trabajadorId || !obra || !fecha) {
    return fail("Trabajador, obra y fecha son obligatorios");
  }
  const t = store.personal.find((p) => p.id === Number(trabajadorId));
  if (!t) return fail("Trabajador no encontrado");
  if (!store.obras.some((o) => o.nombre === obra)) {
    return fail("La obra no existe");
  }
  const estado = inferirEstado({ ingreso, salida, estadoManual });
  const id = store.nextIds.asistencia++;
  const row = {
    id,
    trabajadorId: Number(trabajadorId),
    nombre: t.nombre,
    obra,
    fecha,
    ingreso: ingreso || "",
    salida: salida || "",
    estado,
    tipo,
  };
  store.asistencias.push(row);
  return ok(row);
}

// TODO: reemplazar con PUT /api/asistencias/:id
export async function update(id, datos) {
  await delay();
  const idx = store.asistencias.findIndex((x) => x.id === Number(id));
  if (idx === -1) return fail("Registro no encontrado");
  const cur = store.asistencias[idx];
  const ingreso = datos.ingreso !== undefined ? datos.ingreso : cur.ingreso;
  const salida = datos.salida !== undefined ? datos.salida : cur.salida;
  const estado = inferirEstado({
    ingreso,
    salida,
    estadoManual: datos.estado,
  });
  let nombre = cur.nombre;
  let trabajadorId = cur.trabajadorId;
  if (datos.trabajadorId && datos.trabajadorId !== cur.trabajadorId) {
    const t = store.personal.find((p) => p.id === Number(datos.trabajadorId));
    if (!t) return fail("Trabajador no encontrado");
    trabajadorId = t.id;
    nombre = t.nombre;
  }
  let obra = datos.obra ?? cur.obra;
  if (obra && !store.obras.some((o) => o.nombre === obra)) {
    return fail("La obra no existe");
  }
  store.asistencias[idx] = {
    ...cur,
    ...datos,
    id: Number(id),
    trabajadorId,
    nombre,
    obra,
    fecha: datos.fecha ?? cur.fecha,
    ingreso,
    salida,
    estado,
    tipo: datos.tipo ?? cur.tipo ?? "Normal",
  };
  return ok(store.asistencias[idx]);
}

// TODO: reemplazar con DELETE /api/asistencias/:id
export async function remove(id) {
  await delay();
  const idx = store.asistencias.findIndex((x) => x.id === Number(id));
  if (idx === -1) return fail("Registro no encontrado");
  const [removed] = store.asistencias.splice(idx, 1);
  return ok(removed);
}

/** Todas las filas (para reportes) sin filtros de UI */
export function getAllRaw() {
  // TODO: reemplazar con GET /api/asistencias
  return [...store.asistencias];
}
