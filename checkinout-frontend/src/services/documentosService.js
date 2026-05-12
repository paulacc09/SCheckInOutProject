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

/**
 * Si la URL de Cloudinary es un PDF, reemplaza /image/upload/ por /raw/upload/ para abrir/descargar bien el archivo.
 */
export function fixCloudinaryUrl(url) {
  if (url == null || typeof url !== "string") return url;
  const u = url.trim();
  if (!u) return u;
  const pathForExt = u.split("?")[0].split("#")[0];
  if (!/\.pdf$/i.test(pathForExt)) return u;
  if (!u.includes("/image/upload/")) return u;
  return u.replace("/image/upload/", "/raw/upload/");
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
    archivo_url: row.archivo_url ?? null,
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
  const body = {
    tipo,
    fecha_expedicion: datos.emision,
    fecha_vencimiento: datos.vencimiento,
  };
  if (Object.prototype.hasOwnProperty.call(datos, "archivo_url")) {
    body.archivo_url = datos.archivo_url;
  }
  try {
    const { data } = await api.put(`/documentos/${id}`, body);
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

/**
 * Sube un archivo a Cloudinary (preset sin firmar) desde el navegador.
 */
export async function subirArchivoCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    return { ok: false, message: "Faltan VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET" };
  }
  if (!file || !(file instanceof File)) {
    return { ok: false, message: "Archivo no válido" };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (typeof data.error === "object" && data.error?.message) ||
        (typeof data.error === "string" ? data.error : null) ||
        `Error al subir (${res.status})`;
      return { ok: false, message: msg };
    }
    if (!data.secure_url) {
      return { ok: false, message: "Respuesta inválida de Cloudinary" };
    }
    return { ok: true, data: { url: data.secure_url } };
  } catch (err) {
    return { ok: false, message: err.message || "Error de red al subir el archivo" };
  }
}

export function getTiposOpciones() {
  return ["Examen médico", "Curso de alturas"];
}
