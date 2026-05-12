import api from "../api/axios";

const ESTADO_FILTRO_A_API = {
  Vigente: "vigente",
  "Por vencer": "por_vencer",
  Vencido: "vencido",
};

const TIPO_API_A_ETIQUETA = {
  examen_medico: "Examen médico",
  curso_alturas: "Curso de alturas",
};

const TIPO_ETIQUETA_A_API = {
  "Examen médico": "examen_medico",
  "Curso de alturas": "curso_alturas",
};

function parseIso(s) {
  if (s == null || s === "") return null;
  const str = typeof s === "string" ? s.slice(0, 10) : s;
  const d = new Date(`${str}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diasHastaVencimiento(vencimientoIso) {
  const v = parseIso(vencimientoIso);
  if (!v) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  v.setHours(0, 0, 0, 0);
  return Math.round((v - hoy) / (1000 * 60 * 60 * 24));
}

/** Días hasta vencimiento (negativo = vencido). Exportada para la UI. */
export function calcularEstado(vencimientoIso) {
  const d = diasHastaVencimiento(vencimientoIso);
  if (d === null) return "Vencido";
  if (d < 0) return "Vencido";
  if (d <= 30) return "Por vencer";
  return "Vigente";
}

function toDateIso(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.slice(0, 10);
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function etiquetaTipo(tipoRaw) {
  if (tipoRaw == null) return "";
  const k = String(tipoRaw).trim();
  return TIPO_API_A_ETIQUETA[k] || k;
}

function mapApiRow(row) {
  const venc = toDateIso(row.fecha_vencimiento);
  return {
    id: row.id,
    trabajador: row.trabajador_nombre ?? "",
    tipo: etiquetaTipo(row.tipo),
    emision: toDateIso(row.fecha_expedicion),
    vencimiento: venc,
    estado: calcularEstado(venc),
  };
}

function filtrarPorBusqueda(rows, q) {
  if (!q) return rows;
  const t = q.toLowerCase();
  return rows.filter((d) => `${d.trabajador} ${d.tipo}`.toLowerCase().includes(t));
}

function filtrarPorTab(rows, tab) {
  const t = tab || "Todos";
  if (t === "Todos") return rows;
  if (t === "Vigentes") return rows.filter((d) => d.estado === "Vigente");
  if (t === "Por vencer") return rows.filter((d) => d.estado === "Por vencer");
  if (t === "Vencidos") return rows.filter((d) => d.estado === "Vencido");
  return rows;
}

function filtrarPorTipo(rows, tipo) {
  if (!tipo) return rows;
  return rows.filter((d) => d.tipo === tipo);
}

export async function getAll(filtros = {}) {
  const estadoFiltro =
    filtros.estadoFiltro != null ? String(filtros.estadoFiltro).trim() : "";
  const search = filtros.search != null ? String(filtros.search).trim() : "";

  const params = {};
  if (estadoFiltro) {
    const estadoApi = ESTADO_FILTRO_A_API[estadoFiltro];
    if (estadoApi) params.estado = estadoApi;
  }
  if (search) params.search = search;

  try {
    const res = await api.get("/documentos", { params });
    if (res.data?.ok === false) {
      return { ok: false, message: res.data.message || "Error al cargar documentos" };
    }
    const rawRows = Array.isArray(res.data?.data) ? res.data.data : [];
    let rows = rawRows.map(mapApiRow);
    rows = filtrarPorBusqueda(rows, search);
    rows = filtrarPorTab(rows, filtros.tab);
    rows = filtrarPorTipo(rows, filtros.tipo);
    return { ok: true, data: rows };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || "Error al cargar documentos",
    };
  }
}

export async function getAlertaPorVencer() {
  const res = await getAll({});
  if (!res.ok) return res;
  const porVencer = res.data.filter((d) => d.estado === "Por vencer");
  if (!porVencer.length) {
    return { ok: true, data: { mostrar: false, cantidad: 0, fechaLimite: null } };
  }
  const fechas = porVencer.map((d) => parseIso(d.vencimiento)).filter(Boolean);
  const minTs = Math.min(...fechas.map((d) => d.getTime()));
  const min = new Date(minTs);
  const fechaLimite = min.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return { ok: true, data: { mostrar: true, cantidad: porVencer.length, fechaLimite } };
}

export async function getById(id) {
  try {
    const res = await api.get("/documentos", { params: {} });
    if (res.data?.ok === false) {
      return { ok: false, message: res.data.message || "Error" };
    }
    const rawRows = Array.isArray(res.data?.data) ? res.data.data : [];
    const raw = rawRows.find((r) => String(r.id) === String(id));
    if (!raw) {
      return { ok: false, message: "Documento no encontrado" };
    }
    return { ok: true, data: mapApiRow(raw) };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || "Error al cargar el documento",
    };
  }
}

export async function create(datos) {
  const trabajador_id = datos.trabajador_id ?? datos.trabajadorId;
  const tipoRaw = datos.tipo != null ? String(datos.tipo).trim() : "";
  const tipo = TIPO_ETIQUETA_A_API[tipoRaw] || tipoRaw;
  const fecha_expedicion = datos.fecha_expedicion ?? datos.emision;
  const fecha_vencimiento = datos.fecha_vencimiento ?? datos.vencimiento;
  const archivo_url = datos.archivo_url ?? datos.archivoUrl ?? null;

  try {
    const { data } = await api.post("/documentos", {
      trabajador_id,
      tipo,
      fecha_expedicion,
      fecha_vencimiento,
      archivo_url,
    });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error al crear" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || "Error al crear documento",
    };
  }
}

export async function update(id, datos) {
  const tipoRaw = datos.tipo != null ? String(datos.tipo).trim() : "";
  const tipo = TIPO_ETIQUETA_A_API[tipoRaw] || tipoRaw;
  try {
    const { data } = await api.put(`/documentos/${id}`, {
      tipo,
      fecha_expedicion: datos.emision,
      fecha_vencimiento: datos.vencimiento,
    });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error al actualizar" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || err.message || "Error al actualizar documento",
    };
  }
}

export function getTiposOpciones() {
  return ["Examen médico", "Curso de alturas"];
}
