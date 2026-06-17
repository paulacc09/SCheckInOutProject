export function normalizarListaObras(body) {
  const raw = body?.data ?? body?.obras ?? body;
  return Array.isArray(raw) ? raw : [];
}

export function obraCorrespondeAlUsuario(obra, usuario) {
  if (!obra || usuario?.id == null) return false;
  const uid = Number(usuario.id);
  if (usuario.rol === "inspector_sst") {
    return Number(obra.responsable_sst_id) === uid;
  }
  if (usuario.rol === "encargado") {
    return Number(obra.encargado_id) === uid;
  }
  return true;
}

/** Obra asignada al usuario SST/encargado; null si ninguna coincide. */
export function obtenerObraAsignada(obrasList, usuario) {
  if (!Array.isArray(obrasList) || !obrasList.length) return null;
  return obrasList.find((o) => obraCorrespondeAlUsuario(o, usuario)) ?? null;
}
