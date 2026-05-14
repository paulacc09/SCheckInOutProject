const db = require('../config/db');
const { success, error } = require('../utils/response');

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT tr.*,
        CONCAT(t.nombre,' ',t.apellido) AS trabajador,
        t.cedula,
        o1.nombre AS obra_origen,
        o2.nombre AS obra_destino,
        CONCAT(u.nombre,' ',u.apellido) AS solicitado_por_nombre
      FROM traspasos tr
      JOIN trabajadores t ON t.id = tr.trabajador_id
      JOIN obras o1 ON o1.id = tr.obra_origen_id
      JOIN obras o2 ON o2.id = tr.obra_destino_id
      JOIN usuarios u ON u.id = tr.solicitado_por
      WHERE tr.empresa_id = ?
      ORDER BY tr.created_at DESC
    `, [req.usuario.empresa_id]);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { trabajador_id, obra_origen_id, obra_destino_id, motivo, fecha_traspaso } = req.body;
  if (!trabajador_id || !obra_origen_id || !obra_destino_id)
    return error(res, 'trabajador_id, obra_origen_id y obra_destino_id son requeridos');
  if (obra_origen_id === obra_destino_id)
    return error(res, 'La obra origen y destino no pueden ser la misma');
  try {
    const [result] = await db.query(
      `INSERT INTO traspasos 
       (empresa_id, trabajador_id, obra_origen_id, obra_destino_id, solicitado_por, motivo, fecha_traspaso)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        trabajador_id,
        obra_origen_id,
        obra_destino_id,
        req.usuario.id,
        motivo || null,
        fecha_traspaso || null
      ]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error("ERROR TRASPASOS:", err.message, err.code);
    return error(res, err.message, 500);
  }
};

const actualizarEstado = async (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];
  if (!estadosValidos.includes(estado))
    return error(res, 'estado inválido');
  try {
    const [result] = await db.query(
      `UPDATE traspasos SET estado = ? WHERE id = ? AND empresa_id = ?`,
      [estado, req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Traspaso no encontrado', 404);
    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, crear, actualizarEstado };
