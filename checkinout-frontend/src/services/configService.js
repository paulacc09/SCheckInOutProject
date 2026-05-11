import api from "../api/axios";

export async function getConfig() {
  try {
    const { data } = await api.get("/configuracion");
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function saveConfig(form) {
  try {
    const { data } = await api.put("/configuracion", form);
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}
