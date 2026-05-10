const pool = require("../config/db");

const crearNotificacion = async (datos) => {
  const {
    empresa_id,
    usuario_destino_id,
    usuario_origen_id = null,
    tipo,
    titulo,
    mensaje,
    referencia_id = null,
    referencia_tabla = null,
  } = datos || {};

  if (!empresa_id) throw new Error("El campo empresa_id es obligatorio");
  if (!usuario_destino_id) throw new Error("El campo usuario_destino_id es obligatorio");
  if (!tipo) throw new Error("El campo tipo es obligatorio");
  if (!titulo) throw new Error("El campo titulo es obligatorio");
  if (!mensaje) throw new Error("El campo mensaje es obligatorio");

  const [result] = await pool.execute(
    `INSERT INTO notificaciones
      (empresa_id, usuario_destino_id, usuario_origen_id, tipo, titulo, mensaje, referencia_id, referencia_tabla)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      empresa_id,
      usuario_destino_id,
      usuario_origen_id,
      tipo,
      titulo,
      mensaje,
      referencia_id,
      referencia_tabla,
    ]
  );

  return result.insertId;
};

module.exports = { crearNotificacion };
