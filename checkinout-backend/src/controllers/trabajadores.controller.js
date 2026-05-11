const db = require('../config/db');
const { success, error } = require('../utils/response');
const { crearNotificacion } = require('../utils/notificaciones');

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
    const empresaId = req.usuario.empresa_id;
    const { q = "", estado, obra_id, page = "1", limit = "15" } = req.query;

    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (Number.isNaN(limitNum)) limitNum = 15;
    limitNum = Math.min(Math.max(limitNum, 1), 500);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = `WHERE t.empresa_id = ?`;
    const paramsBase = [empresaId];

    if (estado === 'activo' || estado === 'inactivo') {
      whereClause += ` AND t.estado = ?`;
      paramsBase.push(estado);
    }

    if (obra_id) {
      whereClause += ` AND ob.id = ?`;
      paramsBase.push(String(obra_id).trim());
    }

    const qTrim = String(q || '').trim();
    if (qTrim) {
      const likeNombre = `%${qTrim.toLowerCase()}%`;
      const likeCedula = `%${qTrim.replace(/\s+/g, '')}%`;
      whereClause += ` AND (
        LOWER(t.nombre) LIKE ?
        OR LOWER(t.apellido) LIKE ?
        OR LOWER(CONCAT(t.nombre,' ',t.apellido)) LIKE ?
        OR CAST(t.cedula AS CHAR) LIKE ?
      )`;
      paramsBase.push(likeNombre, likeNombre, likeNombre, likeCedula);
    }

    const fromJoin = `
      FROM trabajadores t
      LEFT JOIN subcargos s ON s.id = t.subcargo_id
      LEFT JOIN empresas e ON e.id = t.empresa_id
      LEFT JOIN asignaciones a ON a.trabajador_id = t.id
        AND a.estado = 'activo'
      LEFT JOIN obras ob ON ob.id = a.obra_id
    `;

    const selectFields = `
      SELECT t.id, t.empresa_id, t.nombre, t.apellido, t.tipo_documento, t.cedula, t.fecha_nacimiento, t.sexo,
             t.telefono, t.email, t.subcargo_id, t.estado, t.created_at, t.updated_at,
             s.nombre AS subcargo, e.nombre AS empresa, ob.id AS obra_id, ob.nombre AS obra_nombre
    `;

    const countSql = `SELECT COUNT(DISTINCT t.id) AS total ${fromJoin} ${whereClause}`;
    const [[countRow]] = await db.query(countSql, paramsBase);
    const total = Number(countRow?.total) || 0;

    const listSql = `${selectFields}
      ${fromJoin}
      ${whereClause}
      ORDER BY t.nombre ASC, t.apellido ASC
      LIMIT ? OFFSET ?
    `;
    const listParams = [...paramsBase, limitNum, offset];
    const [rows] = await db.query(listSql, listParams);

    return success(res, {
      trabajadores: rows,
      total,
      page: pageNum,
      limit: limitNum,
    });
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

    try {
      const [admins] = await db.query(
        `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
        [req.usuario.empresa_id]
      );

      for (const admin of admins) {
        await crearNotificacion({
          empresa_id: req.usuario.empresa_id,
          usuario_destino_id: admin.id,
          usuario_origen_id: req.usuario.id,
          tipo: 'trabajador_editado',
          titulo: 'Trabajador editado',
          mensaje: `El inspector ${req.usuario.nombre} ${req.usuario.apellido} editó al trabajador ${nombre} ${apellido}`,
          referencia_id: parseInt(req.params.id),
          referencia_tabla: 'trabajadores'
        });
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

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

const guardarDescriptor = async (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return error(res, 'Descriptor facial inválido', 400);
  }
  try {
    const [rows] = await db.query(
      `SELECT id FROM trabajadores WHERE id = ? AND empresa_id = ?`,
      [req.params.id, req.usuario.empresa_id]
    );
    if (!rows.length) return error(res, 'Trabajador no encontrado', 404);
    await db.query(
      `UPDATE trabajadores SET descriptor_facial = ? WHERE id = ?`,
      [JSON.stringify(descriptor), req.params.id]
    );
    return success(res, { mensaje: 'Descriptor facial guardado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const identificarPorDescriptor = async (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return error(res, 'Descriptor facial inválido', 400);
  }
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, cedula, descriptor_facial FROM trabajadores 
       WHERE empresa_id = ? AND estado = 'activo' AND descriptor_facial IS NOT NULL`,
      [req.usuario.empresa_id]
    );
    if (!rows.length) return error(res, 'No hay trabajadores con rostro registrado', 404);

    let mejorCoincidencia = null;
    let menorDistancia = Infinity;

    for (const trabajador of rows) {
      const descriptorBD = JSON.parse(trabajador.descriptor_facial);
      const distancia = Math.sqrt(
        descriptor.reduce((sum, val, i) => sum + Math.pow(val - descriptorBD[i], 2), 0)
      );
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        mejorCoincidencia = trabajador;
      }
    }

    if (menorDistancia > 0.6) {
      return error(res, 'Rostro no reconocido', 404);
    }

    return success(res, {
      trabajador: {
        id: mejorCoincidencia.id,
        nombre: mejorCoincidencia.nombre,
        apellido: mejorCoincidencia.apellido,
        cedula: mejorCoincidencia.cedula
      },
      distancia: menorDistancia
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, buscarPorCedula, guardarDescriptor, identificarPorDescriptor };
