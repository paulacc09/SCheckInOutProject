const db = require('../config/db');
const { success, error } = require('../utils/response');

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*,
    CONCAT(u.nombre,' ',u.apellido) AS origen_nombre
  FROM notificaciones n
  LEFT JOIN usuarios u ON u.id = n.usuario_origen_id
  WHERE n.usuario_destino_id = ? AND n.empresa_id = ?
  ORDER BY n.created_at DESC
  LIMIT 50`,
      [req.usuario.id, req.usuario.empresa_id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const badge = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
  FROM notificaciones
  WHERE usuario_destino_id = ? AND empresa_id = ? AND leida = 0`,
      [req.usuario.id, req.usuario.empresa_id]
    );
    return success(res, { total: rows[0].total });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const marcarLeida = async (req, res) => {
  try {
    if (req.params.id === 'todas') {
      await db.query(
        `UPDATE notificaciones SET leida = 1
  WHERE usuario_destino_id = ? AND empresa_id = ?`,
        [req.usuario.id, req.usuario.empresa_id]
      );
    } else {
      const [result] = await db.query(
        `UPDATE notificaciones SET leida = 1
  WHERE id = ? AND usuario_destino_id = ? AND empresa_id = ?`,
        [req.params.id, req.usuario.id, req.usuario.empresa_id]
      );
      if (!result.affectedRows) {
        return error(res, 'Notificación no encontrada', 404);
      }
    }
    return success(res, { mensaje: 'Marcada como leída' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, badge, marcarLeida };
