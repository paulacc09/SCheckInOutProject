const db = require('../config/db');
const { success, error } = require('../utils/response');

const listar = async (req, res) => {
  const { obra_id } = req.query;
  try {
    let query = `
      SELECT n.*, o.nombre AS obra_nombre,
        CONCAT(u.nombre,' ',u.apellido) AS reportado_por_nombre
      FROM novedades n
      JOIN obras o ON o.id = n.obra_id
      JOIN usuarios u ON u.id = n.reportado_por
      WHERE n.empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (obra_id) { query += ` AND n.obra_id = ?`; params.push(obra_id); }
    query += ` ORDER BY n.created_at DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { obra_id, tipo, descripcion, fecha, trabajador_id } = req.body;
  if (!obra_id || !tipo || !descripcion) 
    return error(res, 'obra_id, tipo y descripcion son requeridos');
  const tiposValidos = ['accidente','incidente','condicion_insegura','otro'];
  if (!tiposValidos.includes(tipo)) 
    return error(res, 'tipo inválido');
  try {
    const [result] = await db.query(
      `INSERT INTO novedades 
       (empresa_id, obra_id, reportado_por, tipo, descripcion, fecha, trabajador_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        obra_id,
        req.usuario.id,
        tipo,
        descripcion,
        fecha || new Date().toISOString().split('T')[0],
        trabajador_id || null
      ]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error("ERROR NOVEDADES:", err.message, err.code);
    return error(res, err.message, 500);
  }
};

const actualizarEstado = async (req, res) => {
  const { estado, observacion_resolucion } = req.body;
  const estadosValidos = ['abierta','en_gestion','cerrada'];
  if (!estadosValidos.includes(estado)) 
    return error(res, 'estado inválido');
  try {
    const [result] = await db.query(
      `UPDATE novedades 
       SET estado = ?,
           resuelto_por = ?,
           fecha_resolucion = NOW(),
           observacion_resolucion = ?
       WHERE id = ? AND empresa_id = ?`,
      [estado, req.usuario.id, observacion_resolucion || null, req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Novedad no encontrada', 404);
    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, crear, actualizarEstado };
