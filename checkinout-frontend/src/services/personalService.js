/**
 * Gestión Personal — datos en memoria (store).
 * Los datos iniciales están en ./dataStore.js para mantener consistencia con obras/asistencias.
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

const CARGOS = ["Operario", "Encargado", "Inspector SST"];

// TODO: reemplazar con GET /api/personal?obra=&cargo=&estado=&search=
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", obra = "", cargo = "", estado = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = [...store.personal];
  if (t) {
    rows = rows.filter(
      (p) =>
        `${p.nombre} ${p.documento}`.toLowerCase().includes(t)
    );
  }
  if (obra) rows = rows.filter((p) => p.obra === obra);
  if (cargo) rows = rows.filter((p) => p.cargo === cargo);
  if (estado) rows = rows.filter((p) => p.estado === estado);
  return ok(rows);
}

// TODO: reemplazar con GET /api/personal/:id
export async function getById(id) {
  await delay();
  const row = store.personal.find((p) => p.id === Number(id));
  if (!row) return fail("Trabajador no encontrado");
  return ok(row);
}

// TODO: reemplazar con POST /api/personal  (body: nombre, documento, cargo, obra, correo, telefono, estado)
export async function create(datos) {
  await delay();
  const { nombre, documento, cargo, obra, correo, telefono, estado } = datos;
  if (!nombre?.trim() || !documento?.trim() || !cargo || !obra) {
    return fail("Nombre, documento, cargo y obra son obligatorios");
  }
  if (store.personal.some((p) => p.documento === String(documento).trim())) {
    return fail("Ya existe un trabajador con ese documento");
  }
  if (!store.obras.some((o) => o.nombre === obra)) {
    return fail("La obra seleccionada no existe");
  }
  const id = store.nextIds.personal++;
  store.personal.push({
    id,
    nombre: nombre.trim(),
    documento: String(documento).trim(),
    cargo,
    obra,
    estado: estado === "inactivo" ? "inactivo" : "activo",
    correo: correo?.trim() || "",
    telefono: telefono?.trim() || "",
  });
  return ok(store.personal.find((p) => p.id === id));
}

// TODO: reemplazar con PUT /api/personal/:id
export async function update(id, datos) {
  await delay();
  const idx = store.personal.findIndex((p) => p.id === Number(id));
  if (idx === -1) return fail("Trabajador no encontrado");
  const doc = String(datos.documento ?? store.personal[idx].documento).trim();
  if (
    store.personal.some(
      (p, i) => i !== idx && p.documento === doc
    )
  ) {
    return fail("El documento ya está en uso");
  }
  if (datos.obra && !store.obras.some((o) => o.nombre === datos.obra)) {
    return fail("La obra seleccionada no existe");
  }
  store.personal[idx] = {
    ...store.personal[idx],
    ...datos,
    id: Number(id),
    nombre: datos.nombre?.trim() ?? store.personal[idx].nombre,
    documento: doc,
    correo: datos.correo?.trim() ?? store.personal[idx].correo,
    telefono: datos.telefono?.trim() ?? store.personal[idx].telefono,
  };
  return ok(store.personal[idx]);
}

// TODO: reemplazar con DELETE /api/personal/:id
export async function remove(id) {
  await delay();
  const idx = store.personal.findIndex((p) => p.id === Number(id));
  if (idx === -1) return fail("Trabajador no encontrado");
  const [removed] = store.personal.splice(idx, 1);
  return ok(removed);
}

export function getCargosOpciones() {
  // TODO: reemplazar con GET /api/personal/cargos
  return [...CARGOS];
}

/** Para dropdowns: nombres de obra alineados con store.obras */
export function getObrasNombresDesdePersonal() {
  // TODO: reemplazar con GET /api/obras/options
  return store.obras.map((o) => o.nombre);
}

export function countActivosPorObraNombre(nombreObra) {
  // TODO: reemplazar con GET /api/personal/count?estado=activo&obra=
  return store.personal.filter(
    (p) => p.obra === nombreObra && p.estado === "activo"
  ).length;
}

export function listTrabajadoresParaSelect() {
  // TODO: reemplazar con GET /api/personal/options
  return store.personal.map((p) => ({
    id: p.id,
    label: `${p.nombre} — ${p.documento}`,
    nombre: p.nombre,
    obra: p.obra,
  }));
}
