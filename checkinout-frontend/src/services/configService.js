/**
 * Configuración del sistema (mock en memoria).
 * TODO: reemplazar con GET /api/config y PUT /api/config
 */
import { store } from "./dataStore.js";
import { delay, ok } from "./serviceUtils.js";

function clone() {
  return JSON.parse(JSON.stringify(store.config));
}

export async function getConfig() {
  await delay();
  return ok(clone());
}

export async function saveConfig(patch) {
  await delay();
  if (patch.empresa) Object.assign(store.config.empresa, patch.empresa);
  if (patch.horario) Object.assign(store.config.horario, patch.horario);
  if (patch.notificaciones) Object.assign(store.config.notificaciones, patch.notificaciones);
  return ok(clone());
}
