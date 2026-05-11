/**
 * Documentos admin — CRUD en memoria.
 * TODO: reemplazar con GET /api/documentos?tab=&tipo=&search=
 * TODO: reemplazar con POST /api/documentos (multipart/form-data para subir archivo)
 * TODO: reemplazar con PUT /api/documentos/:id
 * TODO: reemplazar con DELETE /api/documentos/:id
 * NOTA: el estado (Vigente / Por vencer / Vencido) debe calcularse en el backend con la fecha actual
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

function parseIso(s) {
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Días hasta vencimiento (negativo = vencido) */
function diasHastaVencimiento(vencimientoIso) {
  const v = parseIso(vencimientoIso);
  if (!v) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  v.setHours(0, 0, 0, 0);
  return Math.round((v - hoy) / (1000 * 60 * 60 * 24));
}

export function calcularEstado(vencimientoIso) {
  const d = diasHastaVencimiento(vencimientoIso);
  if (d === null) return "Vencido";
  if (d < 0) return "Vencido";
  if (d <= 30) return "Por vencer";
  return "Vigente";
}

function enrich(d) {
  const estado = calcularEstado(d.vencimiento);
  return { ...d, estado };
}

// TODO: reemplazar con GET /api/documentos?tab=X&estado=Y&tipo=Z&search=W
export async function getAll(filtros = {}) {
  await delay();
  const { tab = "Todos", tipo = "", search = "", estadoFiltro = "" } = filtros;
  const t = String(search).trim().toLowerCase();
  let rows = store.documentos.map(enrich);
  if (t) {
    rows = rows.filter(
      (d) => `${d.trabajador} ${d.tipo}`.toLowerCase().includes(t)
    );
  }
  if (tipo) rows = rows.filter((d) => d.tipo === tipo);
  if (estadoFiltro) rows = rows.filter((d) => d.estado === estadoFiltro);
  if (tab === "Vigentes") rows = rows.filter((d) => d.estado === "Vigente");
  if (tab === "Por vencer") rows = rows.filter((d) => d.estado === "Por vencer");
  if (tab === "Vencidos") rows = rows.filter((d) => d.estado === "Vencido");
  return ok(rows);
}

export async function getAlertaPorVencer() {
  await delay();
  const porVencer = store.documentos.filter((d) => calcularEstado(d.vencimiento) === "Por vencer");
  if (!porVencer.length) {
    return ok({ mostrar: false, cantidad: 0, fechaLimite: null });
  }
  const fechas = porVencer
    .map((d) => parseIso(d.vencimiento))
    .filter(Boolean);
  const minTs = Math.min(...fechas.map((d) => d.getTime()));
  const min = new Date(minTs);
  const fechaLimite = min.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return ok({ mostrar: true, cantidad: porVencer.length, fechaLimite });
}

// TODO: reemplazar con GET /api/documentos/:id
export async function getById(id) {
  await delay();
  const d = store.documentos.find((x) => x.id === Number(id));
  if (!d) return fail("Documento no encontrado");
  return ok(enrich(d));
}

// TODO: reemplazar con POST /api/documentos
export async function create(datos) {
  await delay();
  const { trabajadorId, tipo, emision, vencimiento, archivoNombre } = datos;
  if (!trabajadorId || !tipo || !emision || !vencimiento) {
    return fail("Trabajador, tipo, emisión y vencimiento son obligatorios");
  }
  const p = store.personal.find((x) => x.id === Number(trabajadorId));
  if (!p) return fail("Trabajador no encontrado");
  const id = store.nextIds.documento++;
  const row = {
    id,
    trabajadorId: p.id,
    trabajador: p.nombre,
    tipo: tipo.trim(),
    emision,
    vencimiento,
    archivoUrl: archivoNombre || "documento.pdf",
  };
  store.documentos.push(row);
  return ok(enrich(row));
}

// TODO: reemplazar con PUT /api/documentos/:id
export async function update(id, datos) {
  await delay();
  const idx = store.documentos.findIndex((x) => x.id === Number(id));
  if (idx === -1) return fail("Documento no encontrado");
  let trabajador = store.documentos[idx].trabajador;
  let trabajadorId = store.documentos[idx].trabajadorId;
  if (datos.trabajadorId != null && datos.trabajadorId !== "") {
    const p = store.personal.find((x) => x.id === Number(datos.trabajadorId));
    if (!p) return fail("Trabajador no encontrado");
    trabajadorId = p.id;
    trabajador = p.nombre;
  }
  store.documentos[idx] = {
    ...store.documentos[idx],
    trabajadorId,
    trabajador,
    tipo: datos.tipo?.trim() ?? store.documentos[idx].tipo,
    emision: datos.emision ?? store.documentos[idx].emision,
    vencimiento: datos.vencimiento ?? store.documentos[idx].vencimiento,
    archivoUrl: datos.archivoNombre ?? store.documentos[idx].archivoUrl,
  };
  return ok(enrich(store.documentos[idx]));
}

// TODO: reemplazar con DELETE /api/documentos/:id
export async function remove(id) {
  await delay();
  const idx = store.documentos.findIndex((x) => x.id === Number(id));
  if (idx === -1) return fail("Documento no encontrado");
  const [removed] = store.documentos.splice(idx, 1);
  return ok(enrich(removed));
}

/** Tipos existentes en mock (para dropdowns) */
export function getTiposOpciones() {
  const s = new Set(store.documentos.map((d) => d.tipo));
  return [...s].sort();
}
