const db = require('../config/db');
const { success, error } = require('../utils/response');

const sanitizeOptional = (value) => (value ? value : null);

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.nombre AS responsable_nombre, u.apellido AS responsable_apellido
      FROM obras o
      LEFT JOIN usuarios u ON u.id = o.responsable_sst_id
      WHERE o.empresa_id = ?
      ORDER BY o.created_at DESC
    `, [req.usuario.empresa_id]);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.nombre AS responsable_nombre, u.apellido AS responsable_apellido
      FROM obras o
      LEFT JOIN usuarios u ON u.id = o.responsable_sst_id
      WHERE o.id = ? AND o.empresa_id = ?
    `, [req.params.id, req.usuario.empresa_id]);
    if (!rows.length) return error(res, 'Obra no encontrada', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, id_dispositivo } = req.body;
  if (!codigo || !nombre) return error(res, 'codigo y nombre son requeridos');
  try {
    const ciudadSanitized = sanitizeOptional(ciudad);
    const direccionSanitized = sanitizeOptional(direccion);
    const fechaInicioSanitized = sanitizeOptional(fecha_inicio);
    const fechaFinSanitized = sanitizeOptional(fecha_fin);
    const responsableSstIdSanitized = sanitizeOptional(responsable_sst_id);
    const idDispositivoSanitized = sanitizeOptional(id_dispositivo);

    const [result] = await db.query(
      `INSERT INTO obras (empresa_id, codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, id_dispositivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        codigo,
        nombre,
        ciudadSanitized,
        direccionSanitized,
        fechaInicioSanitized,
        fechaFinSanitized,
        responsableSstIdSanitized,
        idDispositivoSanitized
      ]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, id_dispositivo } = req.body;
  try {
    const ciudadSanitized = sanitizeOptional(ciudad);
    const direccionSanitized = sanitizeOptional(direccion);
    const fechaInicioSanitized = sanitizeOptional(fecha_inicio);
    const fechaFinSanitized = sanitizeOptional(fecha_fin);
    const responsableSstIdSanitized = sanitizeOptional(responsable_sst_id);
    const idDispositivoSanitized = sanitizeOptional(id_dispositivo);

    const [result] = await db.query(
      `UPDATE obras SET codigo=?, nombre=?, ciudad=?, direccion=?, fecha_inicio=?, fecha_fin=?, responsable_sst_id=?, id_dispositivo=?
       WHERE id=? AND empresa_id=?`,
      [
        codigo,
        nombre,
        ciudadSanitized,
        direccionSanitized,
        fechaInicioSanitized,
        fechaFinSanitized,
        responsableSstIdSanitized,
        idDispositivoSanitized,
        req.params.id,
        req.usuario.empresa_id
      ]
    );
    if (!result.affectedRows) return error(res, 'Obra no encontrada', 404);
    return success(res, { mensaje: 'Actualizada correctamente' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const cambiarEstado = async (req, res) => {
  const { estado } = req.body;
  if (!['activa', 'finalizada', 'suspendida'].includes(estado)) {
    return error(res, 'Estado inválido');
  }
  try {
    await db.query(
      `UPDATE obras SET estado=? WHERE id=? AND empresa_id=?`,
      [estado, req.params.id, req.usuario.empresa_id]
    );
    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado };