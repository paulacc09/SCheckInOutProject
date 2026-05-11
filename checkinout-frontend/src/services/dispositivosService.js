import api from "../api/axios";

export function getTiposOpciones() {
  return ["Tablet", "Portátil", "Celular", "PC"];
}

export async function getAll({ search, obra, estado } = {}) {
  try {
    const { data } = await api.get("/dispositivos", {
      params: { search, obra, estado },
    });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, data: data.data ?? { rows: [], stats: {} } };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function create(datos) {
  try {
    const { data } = await api.post("/dispositivos", {
      nombre: datos.nombre,
      tipo: datos.tipo,
      obra: datos.obra,
      pin: datos.pin,
      id: datos.id || undefined,
    });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function update(id, datos) {
  try {
    const { data } = await api.put(`/dispositivos/${id}`, {
      nombre: datos.nombre,
      tipo: datos.tipo,
      obra: datos.obra,
      pin: datos.pin,
    });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function updateEstado(id, estado) {
  try {
    const { data } = await api.patch(`/dispositivos/${id}/estado`, { estado });
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, message: data.data?.mensaje };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function remove(id) {
  try {
    const { data } = await api.delete(`/dispositivos/${id}`);
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, message: data.data?.mensaje };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}
