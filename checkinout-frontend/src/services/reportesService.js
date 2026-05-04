/**
 * Reportes — agrega datos desde asistencias en memoria.
 * TODO: reemplazar con GET /api/reportes?obra=&estado=&fechaInicio=&fechaFin=
 * TODO: el backend debe devolver { resumen: {...}, trabajadores: [...] }
 */
import { store } from "./dataStore.js";
import { delay, ok, fail } from "./serviceUtils.js";

function inRange(fechaIso, desde, hasta) {
  if (!desde && !hasta) return true;
  const d = new Date(fechaIso + "T12:00:00");
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
    m.dias.add(r.fecha);
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
    filas.filter((f) => f.estado !== "Ausente").map((f) => f.fecha)
  ).size;
  const ausenciasTotales = filas.filter((f) => f.estado === "Ausente").length;
  const promedioDiario =
    diasConAsistencia > 0
      ? Math.round(
          filas.filter((f) => f.estado !== "Ausente").length /
            diasConAsistencia
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
