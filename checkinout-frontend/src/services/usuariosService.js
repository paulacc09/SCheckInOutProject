/**
 * Usuarios / Roles — CRUD en memoria.
 * Datos en ./dataStore.js
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

const ROLES = ["Administrador", "Inspector SST", "Encargado"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TODO: reemplazar con GET /api/usuarios?search=&rol=&estado=
export async function getAll(filtros = {}) {
  await delay();
  const { search = "", rol = "", estado = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = store.usuarios.map(({ password, ...u }) => ({ ...u }));
  if (t) {
    rows = rows.filter(
      (u) =>
        `${u.nombre} ${u.correo} ${u.obra}`.toLowerCase().includes(t)
    );
  }
  if (rol) rows = rows.filter((u) => u.rol === rol);
  if (estado) rows = rows.filter((u) => u.estado === estado);
  return ok(rows);
}

// TODO: reemplazar con GET /api/usuarios/:id
export async function getById(id) {
  await delay();
  const u = store.usuarios.find((x) => x.id === Number(id));
  if (!u) return fail("Usuario no encontrado");
  const { password, ...rest } = u;
  return ok(rest);
}

// TODO: reemplazar con POST /api/usuarios (el backend debe hashear la contraseña; body: nombre, correo, password, rol, obra, estado)
export async function create(datos) {
  await delay();
  const { nombre, correo, password, rol, obra, estado } = datos;
  if (!nombre?.trim() || !correo?.trim() || !password || !rol || !obra) {
    return fail("Nombre, correo, contraseña, rol y obra son obligatorios");
  }
  if (!emailRegex.test(correo.trim())) {
    return fail("Correo inválido");
  }
  if (String(password).length < 8) {
    return fail("La contraseña debe tener al menos 8 caracteres");
  }
  if (!ROLES.includes(rol)) return fail("Rol inválido");
  if (store.usuarios.some((u) => u.correo.toLowerCase() === correo.trim().toLowerCase())) {
    return fail("Ya existe un usuario con ese correo");
  }
  if (!store.obras.some((o) => o.nombre === obra)) {
    return fail("La obra no existe");
  }
  const id = store.nextIds.usuario++;
  store.usuarios.push({
    id,
    nombre: nombre.trim(),
    correo: correo.trim(),
    password: String(password),
    rol,
    obra,
    estado: estado === "Inactivo" ? "Inactivo" : "Activo",
  });
  const { password: _, ...rest } = store.usuarios.find((u) => u.id === id);
  return ok(rest);
}

// TODO: reemplazar con PUT /api/usuarios/:id
export async function update(id, datos) {
  await delay();
  const idx = store.usuarios.findIndex((u) => u.id === Number(id));
  if (idx === -1) return fail("Usuario no encontrado");
  if (datos.correo && !emailRegex.test(datos.correo.trim())) {
    return fail("Correo inválido");
  }
  if (
    datos.correo &&
    store.usuarios.some(
      (u, i) =>
        i !== idx &&
        u.correo.toLowerCase() === datos.correo.trim().toLowerCase()
    )
  ) {
    return fail("El correo ya está en uso");
  }
  if (datos.password && String(datos.password).length < 8) {
    return fail("La contraseña debe tener al menos 8 caracteres");
  }
  if (datos.obra && !store.obras.some((o) => o.nombre === datos.obra)) {
    return fail("La obra no existe");
  }
  const cur = store.usuarios[idx];
  store.usuarios[idx] = {
    ...cur,
    nombre: datos.nombre?.trim() ?? cur.nombre,
    correo: datos.correo?.trim() ?? cur.correo,
    rol: datos.rol ?? cur.rol,
    obra: datos.obra ?? cur.obra,
    estado: datos.estado ?? cur.estado,
    password:
      datos.password && String(datos.password).trim()
        ? String(datos.password).trim()
        : cur.password,
  };
  const { password, ...rest } = store.usuarios[idx];
  return ok(rest);
}

// TODO: reemplazar con PUT /api/usuarios/:id/rol (body: { rol })
export async function updateRol(id, rol) {
  await delay();
  if (!ROLES.includes(rol)) return fail("Rol inválido");
  const idx = store.usuarios.findIndex((u) => u.id === Number(id));
  if (idx === -1) return fail("Usuario no encontrado");
  store.usuarios[idx].rol = rol;
  const { password, ...rest } = store.usuarios[idx];
  return ok(rest);
}

// TODO: reemplazar con DELETE /api/usuarios/:id
export async function remove(id) {
  await delay();
  const idx = store.usuarios.findIndex((u) => u.id === Number(id));
  if (idx === -1) return fail("Usuario no encontrado");
  const [removed] = store.usuarios.splice(idx, 1);
  const { password, ...rest } = removed;
  return ok(rest);
}

export function getRolesOpciones() {
  // TODO: reemplazar con GET /api/roles/options
  return [...ROLES];
}
