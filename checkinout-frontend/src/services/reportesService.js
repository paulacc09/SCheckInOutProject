import api from "../api/axios";

/** Estado inicial del resumen (sin datos del servidor). */
export function getResumenGlobal() {
  return {
    totalRegistros: 0,
    diasConAsistencia: 0,
    ausenciasTotales: 0,
    promedioDiario: 0,
  };
}

export async function generar(filtros = {}) {
  try {
    const res = await api.get("/reportes/resumen", {
      params: {
        fecha_inicio: filtros.fechaInicio || "",
        fecha_fin: filtros.fechaFin || "",
        obra_id: filtros.obra || "",
      },
    });
    return { ok: true, data: res.data.data };
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Error al generar el resumen";
    return { ok: false, message };
  }
}
