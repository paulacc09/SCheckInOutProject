/**
 * Novedades / traspasos pendientes de aprobación (mock).
 * TODO: reemplazar con GET /api/novedades?tipo=X&tab=Y
 * TODO: reemplazar con PATCH /api/novedades/:id
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

function emitChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("checkinout-novedades-changed"));
  }
}

export function countPendientes() {
  return store.novedades.filter((n) => n.estado === "Pendiente").length;
}

export async function getAll(filtros = {}) {
  await delay();
  const { tab = "Pendientes", tipo = "Todos" } = filtros;
  let rows = [...store.novedades];
  if (tipo && tipo !== "Todos") {
    rows = rows.filter((r) => r.tipo === tipo);
  }
  if (tab === "Pendientes") rows = rows.filter((r) => r.estado === "Pendiente");
  else if (tab === "Novedades") rows = rows.filter((r) => r.tipo === "Novedad");
  else if (tab === "Traspasos") rows = rows.filter((r) => r.tipo === "Traspaso");
  return ok(rows);
}

export async function setEstado(id, { estado, motivoRechazo = "" }) {
  await delay();
  const idx = store.novedades.findIndex((n) => n.id === Number(id));
  if (idx === -1) return fail("Registro no encontrado");
  store.novedades[idx] = {
    ...store.novedades[idx],
    estado,
    motivoRechazo: motivoRechazo || store.novedades[idx].motivoRechazo,
  };
  emitChanged();
  return ok(store.novedades[idx]);
}
