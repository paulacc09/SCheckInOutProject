import api from "../api/axios";

export async function getPerfil() {
  try {
    const { data } = await api.get("/perfil");
    if (data?.ok === false) {
      return { ok: false, message: data.message || "Error" };
    }
    const d = data.data;
    return {
      ok: true,
      data: {
        ...d,
        correo: d.email,
        documento: d.cedula,
      },
    };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function updatePerfil(data) {
  const body = {
    nombre: data.nombre,
    apellido: data.apellido,
    telefono: data.telefono,
  };
  try {
    const { data: res } = await api.put("/perfil", body);
    if (res?.ok === false) {
      return { ok: false, message: res.message || "Error" };
    }
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function cambiarPassword(data) {
  const body = {
    passwordActual: data.passwordActual,
    passwordNueva: data.passwordNueva,
  };
  try {
    const { data: res } = await api.put("/perfil/password", body);
    if (res?.ok === false) {
      return { ok: false, message: res.message || "Error" };
    }
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}

export async function actualizarFoto(file) {
  const formData = new FormData();
  formData.append("foto", file);
  try {
    const { data: res } = await api.put("/perfil/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res?.ok === false) {
      return { ok: false, message: res.message || "Error" };
    }
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || "Error" };
  }
}
