const db = require('../config/db');
const { success, error } = require('../utils/response');

const abrirJornada = async (req, res) => {
  const { obra_id } = req.body;
  if (!obra_id) return error(res, 'obra_id es requerido');
  try {
    const [abierta] = await db.query(
      `SELECT id FROM jornadas_asistencia WHERE obra_id=? AND estado='abierta'`,
      [obra_id]
    );
    if (abierta.length) return error(res, 'Ya existe una jornada abierta para esta obra');

    const [result] = await db.query(
      `INSERT INTO jornadas_asistencia (obra_id, inspector_id) VALUES (?, ?)`,
      [obra_id, req.usuario.id]
    );
    return success(res, { jornada_id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const cerrarJornada = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE jornadas_asistencia SET estado='cerrada', hora_cierre=NOW()
       WHERE id=? AND estado='abierta'`,
      [req.params.id]
    );
    if (!result.affectedRows) return error(res, 'Jornada no encontrada o ya cerrada', 404);
    return success(res, { mensaje: 'Jornada cerrada' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const registrarAsistencia = async (req, res) => {
  const { cedula, tipo, obra_id, metodo = 'cedula' } = req.body;
  if (!cedula || !tipo || !obra_id) return error(res, 'cedula, tipo y obra_id son requeridos');
  if (!['ingreso', 'salida'].includes(tipo)) return error(res, 'tipo debe ser ingreso o salida');

  try {
    const [trabajador] = await db.query(
      `SELECT id FROM trabajadores WHERE cedula=? AND estado='activo'`,
      [cedula]
    );
    if (!trabajador.length) return error(res, 'Trabajador no encontrado o inactivo', 404);

    const [jornada] = await db.query(
      `SELECT id FROM jornadas_asistencia WHERE obra_id=? AND estado='abierta'`,
      [obra_id]
    );
    if (!jornada.length) return error(res, 'No hay jornada abierta para esta obra', 400);

    const trabajador_id = trabajador[0].id;
    const jornada_id = jornada[0].id;

    await db.query(
      `INSERT INTO registros_asistencia (jornada_id, trabajador_id, obra_id, tipo, metodo, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jornada_id, trabajador_id, obra_id, tipo, metodo, req.usuario.id]
    );

    return success(res, { mensaje: `${tipo} registrado correctamente`, timestamp: new Date() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, `Ya existe un registro de ${tipo} para hoy`);
    return error(res, err.message, 500);
  }
};

const listarJornadas = async (req, res) => {
  const { obra_id } = req.query;
  try {
    let query = `
      SELECT j.*, o.nombre AS obra, u.nombre AS inspector_nombre, u.apellido AS inspector_apellido
      FROM jornadas_asistencia j
      JOIN obras o ON o.id = j.obra_id
      JOIN usuarios u ON u.id = j.inspector_id
      WHERE o.empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (obra_id) { query += ` AND j.obra_id = ?`; params.push(obra_id); }
    query += ` ORDER BY j.hora_apertura DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listarRegistros = async (req, res) => {
  const { obra_id, fecha, trabajador_id } = req.query;
  try {
    let query = `
      SELECT r.*, CONCAT(t.nombre,' ',t.apellido) AS trabajador, t.cedula
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      JOIN obras o ON o.id = r.obra_id
      WHERE o.empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (obra_id) { query += ` AND r.obra_id = ?`; params.push(obra_id); }
    if (fecha) { query += ` AND DATE(r.timestamp) = ?`; params.push(fecha); }
    if (trabajador_id) { query += ` AND r.trabajador_id = ?`; params.push(trabajador_id); }
    query += ` ORDER BY r.timestamp DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { abrirJornada, cerrarJornada, registrarAsistencia, listarJornadas, listarRegistros };