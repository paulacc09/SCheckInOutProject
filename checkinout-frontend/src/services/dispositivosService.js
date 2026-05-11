/**
 * Dispositivos — CRUD en memoria.
 * Datos en ./dataStore.js
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

const TIPOS = ["Tablet", "PC/Web", "Biométrico", "Otro", "Portátil"];

function nextDevId() {
  const nums = store.dispositivos
    .map((d) => {
      const m = String(d.id).match(/^DEV-(\d+)$/i);
      return m ? Number(m[1]) : 0;
    });
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DEV-${String(n).padStart(3, "0")}`;
}

function statsFrom(list) {
  const total = list.length;
  const activos = list.filter((d) => d.estado === "Activo").length;
  const inactivos = list.filter((d) => d.estado === "Inactivo").length;
  const sinAsignar = list.filter((d) => !d.obra || d.obra === "Sin asignar").length;
  return { total, activos, inactivos, sinAsignar };
}

// TODO: reemplazar con GET /api/dispositivos?search=&obra=&estado=
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", obra = "", estado = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = [...store.dispositivos];
  if (t) {
    rows = rows.filter(
      (d) => `${d.nombre} ${d.id} ${d.tipo}`.toLowerCase().includes(t)
    );
  }
  if (obra) rows = rows.filter((d) => d.obra === obra);
  if (estado) rows = rows.filter((d) => d.estado === estado);
  return ok({ rows, stats: statsFrom(store.dispositivos) });
}

// TODO: reemplazar con GET /api/dispositivos/:id
export async function getById(id) {
  await delay();
  const d = store.dispositivos.find((x) => x.id === id);
  if (!d) return fail("Dispositivo no encontrado");
  return ok({ ...d });
}

// TODO: reemplazar con POST /api/dispositivos (auto-generar DEV-XXX si no se provee id)
export async function create(datos) {
  await delay();
  const { nombre, tipo, obra, pin, id: idProp } = datos;
  if (!nombre?.trim() || !tipo) {
    return fail("Nombre y tipo son obligatorios");
  }
  if (pin && !/^\d{4,6}$/.test(String(pin))) {
    return fail("El PIN debe tener entre 4 y 6 dígitos");
  }
  if (obra && !store.obras.some((o) => o.nombre === obra)) {
    return fail("La obra no existe");
  }
  const id =
    idProp && String(idProp).trim()
      ? String(idProp).trim()
      : nextDevId();
  if (store.dispositivos.some((d) => d.id === id)) {
    return fail("Ya existe un dispositivo con ese ID");
  }
  store.dispositivos.push({
    id,
    nombre: nombre.trim(),
    tipo,
    obra: obra || "Sin asignar",
    ultimoAcceso: new Date().toISOString(),
    estado: datos.estado === "Inactivo" ? "Inactivo" : "Activo",
    pin: pin ? String(pin) : "",
  });
  return ok(store.dispositivos.find((d) => d.id === id));
}

// TODO: reemplazar con PUT /api/dispositivos/:id
export async function update(id, datos) {
  await delay();
  const idx = store.dispositivos.findIndex((d) => d.id === id);
  if (idx === -1) return fail("Dispositivo no encontrado");
  if (datos.obra && !store.obras.some((o) => o.nombre === datos.obra) && datos.obra !== "Sin asignar") {
    return fail("La obra no existe");
  }
  if (datos.pin && !/^\d{4,6}$/.test(String(datos.pin))) {
    return fail("El PIN debe tener entre 4 y 6 dígitos");
  }
  store.dispositivos[idx] = {
    ...store.dispositivos[idx],
    nombre: datos.nombre?.trim() ?? store.dispositivos[idx].nombre,
    tipo: datos.tipo ?? store.dispositivos[idx].tipo,
    obra: datos.obra ?? store.dispositivos[idx].obra,
    pin: datos.pin !== undefined ? String(datos.pin) : store.dispositivos[idx].pin,
    estado: datos.estado ?? store.dispositivos[idx].estado,
    ultimoAcceso:
      datos.ultimoAcceso ?? store.dispositivos[idx].ultimoAcceso,
  };
  return ok(store.dispositivos[idx]);
}

// TODO: reemplazar con PUT /api/dispositivos/:id/estado (body: { estado })
export async function updateEstado(id, estado) {
  await delay();
  if (!["Activo", "Inactivo"].includes(estado)) {
    return fail("Estado inválido");
  }
  const idx = store.dispositivos.findIndex((d) => d.id === id);
  if (idx === -1) return fail("Dispositivo no encontrado");
  store.dispositivos[idx].estado = estado;
  store.dispositivos[idx].ultimoAcceso = new Date().toISOString();
  return ok(store.dispositivos[idx]);
}

// TODO: reemplazar con DELETE /api/dispositivos/:id
export async function remove(id) {
  await delay();
  const idx = store.dispositivos.findIndex((d) => d.id === id);
  if (idx === -1) return fail("Dispositivo no encontrado");
  const [removed] = store.dispositivos.splice(idx, 1);
  return ok(removed);
}

export function getTiposOpciones() {
  // TODO: reemplazar con GET /api/dispositivos/tipos
  return [...TIPOS];
}
