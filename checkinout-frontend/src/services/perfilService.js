/**
 * Perfil del usuario logueado (mock).
 * TODO: reemplazar con GET /api/perfil y PUT /api/perfil
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

function clone() {
  return JSON.parse(JSON.stringify(store.perfil));
}

export async function getPerfil() {
  await delay();
  return ok(clone());
}

export async function updatePerfil(datos) {
  await delay();
  const { nombre, apellido, correo, telefono } = datos;
  if (nombre != null) store.perfil.nombre = String(nombre).trim();
  if (apellido != null) store.perfil.apellido = String(apellido).trim();
  if (correo != null) store.perfil.correo = String(correo).trim();
  if (telefono != null) store.perfil.telefono = String(telefono).trim();
  return ok(clone());
}

export async function updatePassword({ nueva, confirmar }) {
  await delay();
  if (!nueva || nueva.length < 8) return fail("La nueva contraseña debe tener al menos 8 caracteres");
  if (!/[^a-zA-Z0-9]/.test(nueva)) return fail("Incluye al menos un carácter especial");
  if (nueva !== confirmar) return fail("Las contraseñas nuevas no coinciden");
  return ok({ ok: true });
}
