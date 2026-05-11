/**
 * Reportes — agrega datos desde asistencias en memoria + tabla mock por defecto.
 * TODO: reemplazar con GET /api/reportes?obra=&estado=&fechaInicio=&fechaFin=
 * TODO: el backend debe devolver { resumen: {...}, trabajadores: [...] }
 */
import { store } from "./dataStore.js";
import { delay, ok } from "./serviceUtils.js";

/** Tabla mostrada antes de pulsar Generar (mock). */
export const MOCK_TABLA_REPORTES = [
  { id: 1, nombre: "Pepito Andres Perez Roa", obra: "Mandarino", diasAsistidos: 20, ausencias: 0, horasTotales: 240 },
  { id: 2, nombre: "Jose Steven Peña Hernan.", obra: "H. Peñalisa", diasAsistidos: 18, ausencias: 2, horasTotales: 216 },
  { id: 3, nombre: "Javier Esteban Rendón R.", obra: "H. Nakare", diasAsistidos: 20, ausencias: 0, horasTotales: 240 },
  { id: 4, nombre: "Pepito Andres Perez Roa", obra: "Mandarino", diasAsistidos: 15, ausencias: 5, horasTotales: 180 },
  { id: 5, nombre: "Jose Steven Peña Hernan.", obra: "H. Peñalisa", diasAsistidos: 20, ausencias: 0, horasTotales: 240 },
];

/** Resumen global (sin filtros / sin generar). */
export function getResumenGlobal() {
  return {
    totalRegistros: 3001,
    diasConAsistencia: 20,
    ausenciasTotales: 15,
    promedioDiario: 110,
  };
}

/** Convierte fecha de asistencia (DD/MM/YYYY o YYYY-MM-DD) a ISO yyyy-mm-dd. */
export function fechaAsistenciaToIso(s) {
  if (!s) return null;
  const str = String(s).trim();
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

function inRange(fechaRaw, desde, hasta) {
  const iso = fechaAsistenciaToIso(fechaRaw);
  if (!iso) return !desde && !hasta;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  if (desde && d < new Date(desde + "T00:00:00")) return false;
  if (hasta && d > new Date(hasta + "T23:59:59")) return false;
  return true;
}

function filtrarAsistencias({ obra, estado, fechaInicio, fechaFin }) {
  return store.asistencias.filter((r) => {
    if (obra && r.obra !== obra) return false;
    if (estado && r.estado !== estado) return false;
    if (!inRange(r.fecha, fechaInicio, fechaFin)) return false;
    return true;
  });
}

function agregar(filas) {
  const map = new Map();
  for (const r of filas) {
    const key = `${r.nombre}|${r.obra}`;
    if (!map.has(key)) {
      map.set(key, {
        nombre: r.nombre,
        obra: r.obra,
        dias: new Set(),
        ausencias: 0,
        horas: 0,
      });
    }
    const m = map.get(key);
    if (r.estado === "Ausente") {
      m.ausencias += 1;
      continue;
    }
    m.dias.add(fechaAsistenciaToIso(r.fecha) || r.fecha);
    if (r.ingreso && r.salida) m.horas += 12;
    else if (r.ingreso) m.horas += 6;
  }
  return [...map.values()].map((row, i) => ({
    id: i + 1,
    nombre: row.nombre,
    obra: row.obra,
    diasAsistidos: row.dias.size,
    ausencias: row.ausencias,
    horasTotales: Math.round(row.horas),
  }));
}

function resumenDesde(filas) {
  const totalRegistros = filas.length;
  const diasConAsistencia = new Set(
    filas.filter((f) => f.estado !== "Ausente").map((f) => fechaAsistenciaToIso(f.fecha) || f.fecha)
  ).size;
  const ausenciasTotales = filas.filter((f) => f.estado === "Ausente").length;
  const promedioDiario =
    diasConAsistencia > 0
      ? Math.round(
          filas.filter((f) => f.estado !== "Ausente").length / diasConAsistencia
        )
      : 0;
  return {
    totalRegistros,
    diasConAsistencia,
    ausenciasTotales,
    promedioDiario,
  };
}

export async function generar(filtros = {}) {
  await delay();
  const { obra = "", estado = "", fechaInicio = "", fechaFin = "" } = filtros;
  const filas = filtrarAsistencias({
    obra,
    estado,
    fechaInicio,
    fechaFin,
  });
  if (!filas.length) {
    return ok({
      resumen: resumenDesde(filas),
      trabajadores: [],
      vacio: true,
    });
  }
  return ok({
    resumen: resumenDesde(filas),
    trabajadores: agregar(filas),
    vacio: false,
  });
}
