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
  const { fecha_inicio, fecha_fin, obra_id } = req.query;
  try {
    const fechaDesde = fecha_inicio || new Date().toISOString().split('T')[0];
    const fechaHasta = fecha_fin || fechaDesde;
    let query = `
      SELECT 
        t.id,
        CONCAT(t.nombre,' ',t.apellido) AS trabajador,
        t.cedula,
        COUNT(DISTINCT fechas.fecha) AS total_ausencias
      FROM trabajadores t
      JOIN (
        SELECT DISTINCT DATE(timestamp) AS fecha, obra_id
        FROM registros_asistencia
        WHERE DATE(timestamp) BETWEEN ? AND ?
        ${obra_id ? 'AND obra_id = ?' : ''}
      ) AS fechas ON 1=1
      WHERE t.empresa_id = ? AND t.estado = 'activo'
      AND NOT EXISTS (
        SELECT 1 FROM registros_asistencia r
        WHERE r.trabajador_id = t.id
          AND DATE(r.timestamp) = fechas.fecha
          AND r.tipo = 'ingreso'
          ${obra_id ? 'AND r.obra_id = ?' : ''}
      )
      GROUP BY t.id
      HAVING total_ausencias > 0
      ORDER BY total_ausencias DESC
    `;
    const params = [fechaDesde, fechaHasta];
    if (obra_id) params.push(obra_id);
    params.push(req.usuario.empresa_id);
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
        v.trabajador_id,
        v.trabajador,
        v.cedula,
        COUNT(DISTINCT v.fecha) AS dias_trabajados,
        ROUND(SUM(COALESCE(v.horas_trabajadas, 0)), 2) AS total_horas
      FROM vista_asistencia_diaria v
      JOIN registros_asistencia r 
        ON r.trabajador_id = v.trabajador_id 
        AND DATE(r.timestamp) = v.fecha
        AND r.tipo = 'ingreso'
        AND r.estado = 'valido'
      JOIN trabajadores t ON t.id = v.trabajador_id
      WHERE t.empresa_id = ?
        AND v.fecha BETWEEN ? AND ?
        ${obra_id ? 'AND r.obra_id = ?' : ''}
      GROUP BY v.trabajador_id, v.trabajador, v.cedula
      ORDER BY total_horas DESC
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