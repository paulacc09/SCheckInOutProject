const db = require('../config/db');
const { success, error } = require('../utils/response');

const sanitizeOptional = (value) => (value ? value : null);
const cedulaRegex = /^\d{5,15}$/;
const telefonoRegex = /^\d{7,15}$/;
const nombreApellidoRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,50}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tiposDocumentoValidos = ['CC', 'CE', 'Pasaporte', 'TI', 'PEP'];
const sexosValidos = ['M', 'F', 'Otro'];

const validarDatosTrabajador = ({ nombre, apellido, cedula, telefono, email, tipo_documento, sexo }, res) => {
  const nombreLimpio = String(nombre || '').trim();
  const apellidoLimpio = String(apellido || '').trim();
  const cedulaLimpia = String(cedula || '').trim();
  const telefonoLimpio = telefono ? String(telefono).trim() : '';
  const emailLimpio = email ? String(email).trim() : '';
  const tipoDocumentoFinal = tipo_documento || 'CC';
  const sexoLimpio = sexo ? String(sexo).trim() : '';

  if (!nombreApellidoRegex.test(nombreLimpio)) {
    error(res, 'El nombre debe tener entre 2 y 50 caracteres y solo contener letras y espacios.', 400);
    return false;
  }
  if (!nombreApellidoRegex.test(apellidoLimpio)) {
    error(res, 'El apellido debe tener entre 2 y 50 caracteres y solo contener letras y espacios.', 400);
    return false;
  }
  if (!cedulaRegex.test(cedulaLimpia)) {
    error(res, 'La cédula debe contener solo números y tener entre 5 y 15 dígitos.', 400);
    return false;
  }
  if (telefonoLimpio && !telefonoRegex.test(telefonoLimpio)) {
    error(res, 'El teléfono debe contener solo números y tener entre 7 y 15 dígitos.', 400);
    return false;
  }
  if (emailLimpio && !emailRegex.test(emailLimpio)) {
    error(res, 'El email debe tener un formato válido (usuario@dominio).', 400);
    return false;
  }
  if (!tiposDocumentoValidos.includes(tipoDocumentoFinal)) {
    error(res, 'El tipo de documento es inválido. Debe ser CC, CE, Pasaporte, TI o PEP.', 400);
    return false;
  }
  if (sexoLimpio && !sexosValidos.includes(sexoLimpio)) {
    error(res, 'El sexo es inválido. Debe ser M, F u Otro.', 400);
    return false;
  }
  return true;
};

const asignarObraSiCorresponde = async ({ trabajadorId, obraId }) => {
  const obraIdSanitized = sanitizeOptional(obraId);
  if (!obraIdSanitized) return;

  const [existeAsignacion] = await db.query(
    `SELECT id
     FROM asignaciones
     WHERE trabajador_id = ? AND obra_id = ? AND estado = 'activo'
     LIMIT 1`,
    [trabajadorId, obraIdSanitized]
  );

  if (existeAsignacion.length) return;

  await db.query(
    `UPDATE asignaciones
     SET estado = 'retirado', fecha_retiro = CURDATE()
     WHERE trabajador_id = ? AND estado = 'activo'`,
    [trabajadorId]
  );

  await db.query(
    `INSERT INTO asignaciones (trabajador_id, obra_id, fecha_asignacion, estado)
     VALUES (?, ?, CURDATE(), 'activo')`,
    [trabajadorId, obraIdSanitized]
  );
};

const listar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.id, t.empresa_id, t.nombre, t.apellido, t.tipo_documento, t.cedula, t.fecha_nacimiento, t.sexo,
             t.telefono, t.email, t.subcargo_id, t.estado, t.created_at, t.updated_at,
             s.nombre AS subcargo, e.nombre AS empresa, ob.id AS obra_id, ob.nombre AS obra_nombre
      FROM trabajadores t
      LEFT JOIN subcargos s ON s.id = t.subcargo_id
      LEFT JOIN empresas e ON e.id = t.empresa_id
      LEFT JOIN asignaciones a ON a.trabajador_id = t.id 
        AND a.estado = 'activo'
      LEFT JOIN obras ob ON ob.id = a.obra_id
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
      SELECT t.id, t.empresa_id, t.nombre, t.apellido, t.tipo_documento, t.cedula, t.fecha_nacimiento, t.sexo,
             t.telefono, t.email, t.subcargo_id, t.estado, t.created_at, t.updated_at,
             s.nombre AS subcargo
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
  const { nombre, apellido, tipo_documento, cedula, fecha_nacimiento, sexo, telefono, email, subcargo_id, obra_id } = req.body;
  if (!nombre || !apellido || !cedula) {
    return error(res, 'nombre, apellido y cedula son requeridos');
  }
  if (!validarDatosTrabajador({ nombre, apellido, cedula, telefono, email, tipo_documento, sexo }, res)) return;
  try {
    const tipoDocumentoFinal = tipo_documento || 'CC';
    const fechaNacimientoSanitized = sanitizeOptional(fecha_nacimiento);
    const sexoSanitized = sanitizeOptional(sexo);
    const telefonoSanitized = sanitizeOptional(telefono);
    const emailSanitized = sanitizeOptional(email);
    const subcargoIdSanitized = sanitizeOptional(subcargo_id);

    const [result] = await db.query(
      `INSERT INTO trabajadores (empresa_id, nombre, apellido, tipo_documento, cedula, fecha_nacimiento, sexo, telefono, email, subcargo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.empresa_id, nombre, apellido, tipoDocumentoFinal, cedula, fechaNacimientoSanitized, sexoSanitized, telefonoSanitized, emailSanitized, subcargoIdSanitized]
    );
    await asignarObraSiCorresponde({ trabajadorId: result.insertId, obraId: obra_id });
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'La cédula ya está registrada');
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { nombre, apellido, tipo_documento, cedula, fecha_nacimiento, sexo, telefono, email, subcargo_id, estado, obra_id } = req.body;
  if (!validarDatosTrabajador({ nombre, apellido, cedula, telefono, email, tipo_documento, sexo }, res)) return;
  try {
    const tipoDocumentoFinal = tipo_documento || 'CC';
    const fechaNacimientoSanitized = sanitizeOptional(fecha_nacimiento);
    const sexoSanitized = sanitizeOptional(sexo);
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
      `UPDATE trabajadores SET nombre=?, apellido=?, tipo_documento=?, cedula=?, fecha_nacimiento=?, sexo=?, telefono=?, email=?, subcargo_id=?, estado=?
       WHERE id=? AND empresa_id=?`,
      [nombre, apellido, tipoDocumentoFinal, cedula, fechaNacimientoSanitized, sexoSanitized, telefonoSanitized, emailSanitized, subcargoIdSanitized, estadoFinal, req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Trabajador no encontrado', 404);
    await asignarObraSiCorresponde({ trabajadorId: req.params.id, obraId: obra_id });
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
