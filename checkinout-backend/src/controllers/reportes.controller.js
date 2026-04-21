const db = require('../config/db');
const { success, error } = require('../utils/response');

const asistenciaDiaria = async (req, res) => {
  const { fecha_inicio, fecha_fin, obra_id } = req.query;
  if (!fecha_inicio || !fecha_fin) return error(res, 'fecha_inicio y fecha_fin son requeridos');
  try {
    let query = `
      SELECT * FROM vista_asistencia_diaria
      WHERE fecha BETWEEN ? AND ?
    `;
    const params = [fecha_inicio, fecha_fin];
    if (obra_id) {
      query = `
        SELECT v.* FROM vista_asistencia_diaria v
        JOIN registros_asistencia r ON r.trabajador_id = v.trabajador_id AND DATE(r.timestamp) = v.fecha
        WHERE v.fecha BETWEEN ? AND ? AND r.obra_id = ?
        GROUP BY v.trabajador_id, v.fecha
      `;
      params.push(obra_id);
    }
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const ausencias = async (req, res) => {
  const { fecha, obra_id } = req.query;
  try {
    let query = `
      SELECT t.id, CONCAT(t.nombre,' ',t.apellido) AS trabajador, t.cedula
      FROM trabajadores t
      WHERE t.empresa_id = ? AND t.estado = 'activo'
      AND t.id NOT IN (
        SELECT trabajador_id FROM registros_asistencia
        WHERE DATE(timestamp) = ? AND tipo = 'ingreso'
        ${obra_id ? 'AND obra_id = ?' : ''}
      )
    `;
    const params = [req.usuario.empresa_id, fecha || new Date().toISOString().split('T')[0]];
    if (obra_id) params.push(obra_id);
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const horasTrabajadas = async (req, res) => {
  const { fecha_inicio, fecha_fin, obra_id } = req.query;
  if (!fecha_inicio || !fecha_fin) return error(res, 'fecha_inicio y fecha_fin son requeridos');
  try {
    let query = `
      SELECT 
        t.id AS trabajador_id,
        CONCAT(t.nombre,' ',t.apellido) AS trabajador,
        t.cedula,
        SUM(TIMESTAMPDIFF(MINUTE,
          (SELECT MIN(r2.timestamp) FROM registros_asistencia r2 WHERE r2.trabajador_id = r.trabajador_id AND DATE(r2.timestamp) = DATE(r.timestamp) AND r2.tipo='ingreso'),
          (SELECT MAX(r3.timestamp) FROM registros_asistencia r3 WHERE r3.trabajador_id = r.trabajador_id AND DATE(r3.timestamp) = DATE(r.timestamp) AND r3.tipo='salida')
        )) / 60 AS total_horas,
        COUNT(DISTINCT DATE(r.timestamp)) AS dias_trabajados
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      WHERE t.empresa_id = ? AND DATE(r.timestamp) BETWEEN ? AND ? AND r.tipo = 'ingreso' AND r.estado = 'valido'
      ${obra_id ? 'AND r.obra_id = ?' : ''}
      GROUP BY t.id
    `;
    const params = [req.usuario.empresa_id, fecha_inicio, fecha_fin];
    if (obra_id) params.push(obra_id);
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { asistenciaDiaria, ausencias, horasTrabajadas };