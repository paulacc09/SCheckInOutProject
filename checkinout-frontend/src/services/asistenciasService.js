import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

// TODO: reemplazar con GET /api/asistencias?search=&obra=&fecha=&tipo=&estado=
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", obra = "", fecha = "", tipo = "", estado = "" } = filtros;
  const q = String(search).trim().toLowerCase();
  let rows = [...store.asistencias];
  if (q) rows = rows.filter((r) => r.nombre.toLowerCase().includes(q));
  if (obra) rows = rows.filter((r) => r.obra === obra);
  if (fecha) rows = rows.filter((r) => r.fecha === fecha);
  if (tipo) rows = rows.filter((r) => r.tipo === tipo);
  if (estado) rows = rows.filter((r) => r.estado === estado);
  return ok(rows);
}

// TODO: reemplazar con GET /api/asistencias/:id
export async function getById(id) {
  await delay();
  const row = store.asistencias.find((r) => r.id === Number(id));
  if (!row) return fail("Registro no encontrado");
  return ok({ ...row });
}

// TODO: reemplazar con PUT /api/asistencias/:id
export async function update(id, datos) {
  await delay();
  const idx = store.asistencias.findIndex((r) => r.id === Number(id));
  if (idx === -1) return fail("Registro no encontrado");
  store.asistencias[idx] = {
    ...store.asistencias[idx],
    obra: datos.obra,
    fecha: datos.fecha,
    ingreso: datos.ingreso || null,
    salida: datos.salida || null,
    tipo: datos.tipo,
    estado: datos.estado,
  };
  return ok(store.asistencias[idx]);
}

// TODO: reemplazar con DELETE /api/asistencias/:id
export async function remove(id) {
  await delay();
  const idx = store.asistencias.findIndex((r) => r.id === Number(id));
  if (idx === -1) return fail("Registro no encontrado");
  const [deleted] = store.asistencias.splice(idx, 1);
  return ok(deleted);
}
