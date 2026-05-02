const db = require('../config/db');
const { success, error } = require('../utils/response');

const sanitizeOptional = (value) => (value ? value : null);

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, s.nombre AS subcargo, e.nombre AS empresa
      FROM trabajadores t
      LEFT JOIN subcargos s ON s.id = t.subcargo_id
      LEFT JOIN empresas e ON e.id = t.empresa_id
      WHERE t.empresa_id = ?
      ORDER BY t.nombre
    `, [req.usuario.empresa_id]);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, s.nombre AS subcargo
      FROM trabajadores t
      LEFT JOIN subcargos s ON s.id = t.subcargo_id
      WHERE t.id = ? AND t.empresa_id = ?
    `, [req.params.id, req.usuario.empresa_id]);
    if (!rows.length) return error(res, 'Trabajador no encontrado', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { nombre, apellido, cedula, telefono, email, subcargo_id } = req.body;
  if (!nombre || !apellido || !cedula) {
    return error(res, 'nombre, apellido y cedula son requeridos');
  }
  try {
    const telefonoSanitized = sanitizeOptional(telefono);
    const emailSanitized = sanitizeOptional(email);
    const subcargoIdSanitized = sanitizeOptional(subcargo_id);

    const [result] = await db.query(
      `INSERT INTO trabajadores (empresa_id, nombre, apellido, cedula, telefono, email, subcargo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.empresa_id, nombre, apellido, cedula, telefonoSanitized, emailSanitized, subcargoIdSanitized]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'La cédula ya está registrada');
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { nombre, apellido, cedula, telefono, email, subcargo_id, estado } = req.body;
  try {
    const telefonoSanitized = sanitizeOptional(telefono);
    const emailSanitized = sanitizeOptional(email);
    const subcargoIdSanitized = sanitizeOptional(subcargo_id);
    const estadoSanitized = (estado || 'activo').toLowerCase();

    const [rows] = await db.query(
      `SELECT estado FROM trabajadores WHERE id=? AND empresa_id=?`,
      [req.params.id, req.usuario.empresa_id]
    );
    if (!rows.length) return error(res, 'Trabajador no encontrado', 404);

    const estadoFinal = ['activo', 'inactivo'].includes(estadoSanitized)
      ? estadoSanitized
      : rows[0].estado;

    const [result] = await db.query(
      `UPDATE trabajadores SET nombre=?, apellido=?, cedula=?, telefono=?, email=?, subcargo_id=?, estado=?
       WHERE id=? AND empresa_id=?`,
      [nombre, apellido, cedula, telefonoSanitized, emailSanitized, subcargoIdSanitized, estadoFinal, req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Trabajador no encontrado', 404);
    return success(res, { mensaje: 'Actualizado correctamente' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const cambiarEstado = async (req, res) => {
  const { estado } = req.body;
  if (!['activo', 'inactivo'].includes(estado)) {
    return error(res, 'Estado inválido');
  }
  try {
    await db.query(
      `UPDATE trabajadores SET estado=? WHERE id=? AND empresa_id=?`,
      [estado, req.params.id, req.usuario.empresa_id]
    );
    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const buscarPorCedula = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, s.nombre AS subcargo FROM trabajadores t
       LEFT JOIN subcargos s ON s.id = t.subcargo_id
       WHERE t.cedula = ? AND t.empresa_id = ?`,
      [req.params.cedula, req.usuario.empresa_id]
    );
    if (!rows.length) return error(res, 'Trabajador no encontrado', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, buscarPorCedula };
