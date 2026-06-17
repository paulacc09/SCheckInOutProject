const db = require('../config/db');
const { success, error } = require('../utils/response');

const sanitizeOptional = (value) => (value ? value : null);
const codigoRegex = /^[A-Z0-9-]{3,20}$/;
const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s-]{3,100}$/;
const ciudadRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,60}$/;
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

const validarDatosObra = ({ codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin }, res) => {
  const codigoLimpio = String(codigo || '').trim();
  const nombreLimpio = String(nombre || '').trim();
  const ciudadLimpia = ciudad ? String(ciudad).trim() : '';
  const direccionLimpia = direccion ? String(direccion).trim() : '';
  const fechaInicioLimpia = fecha_inicio ? String(fecha_inicio).trim() : '';
  const fechaFinLimpia = fecha_fin ? String(fecha_fin).trim() : '';

  if (!codigoLimpio || !nombreLimpio) {
    error(res, 'codigo y nombre son requeridos', 400);
    return false;
  }
  if (!codigoRegex.test(codigoLimpio)) {
    error(res, 'El código debe tener entre 3 y 20 caracteres, en mayúsculas, sin espacios y solo con números o guiones.', 400);
    return false;
  }
  if (!nombreRegex.test(nombreLimpio)) {
    error(res, 'El nombre debe tener entre 3 y 100 caracteres y solo contener letras, números, espacios y guiones.', 400);
    return false;
  }
  if (ciudadLimpia && !ciudadRegex.test(ciudadLimpia)) {
    error(res, 'La ciudad debe tener entre 2 y 60 caracteres y solo contener letras y espacios.', 400);
    return false;
  }
  if (direccionLimpia && (direccionLimpia.length < 5 || direccionLimpia.length > 150)) {
    error(res, 'La dirección debe tener entre 5 y 150 caracteres.', 400);
    return false;
  }
  if (fechaInicioLimpia && !fechaRegex.test(fechaInicioLimpia)) {
    error(res, 'La fecha de inicio debe tener formato válido YYYY-MM-DD.', 400);
    return false;
  }
  if (fechaFinLimpia && !fechaRegex.test(fechaFinLimpia)) {
    error(res, 'La fecha de fin debe tener formato válido YYYY-MM-DD.', 400);
    return false;
  }
  if (fechaInicioLimpia && fechaFinLimpia) {
    const fechaInicioObj = new Date(fechaInicioLimpia);
    const fechaFinObj = new Date(fechaFinLimpia);
    if (fechaFinObj < fechaInicioObj) {
      error(res, 'La fecha de fin debe ser igual o posterior a la fecha de inicio.', 400);
      return false;
    }
  }
  return true;
};

const listar = async (req, res) => {
  try {
    const verTodas = req.query.todas === '1' || req.query.todas === 'true';
    let query = `
      SELECT o.*,
        u.nombre AS responsable_nombre, u.apellido AS responsable_apellido,
        ue.nombre AS encargado_nombre, ue.apellido AS encargado_apellido
      FROM obras o
      LEFT JOIN usuarios u ON u.id = o.responsable_sst_id
      LEFT JOIN usuarios ue ON ue.id = o.encargado_id
      WHERE o.empresa_id = ?`;
    const params = [req.usuario.empresa_id];

    if (!verTodas) {
      if (req.usuario.rol === 'inspector_sst') {
        query += ' AND o.responsable_sst_id = ?';
        params.push(req.usuario.id);
      } else if (req.usuario.rol === 'encargado') {
        query += ' AND o.encargado_id = ?';
        params.push(req.usuario.id);
      }
    } else if (req.usuario.rol !== 'administrador' && req.usuario.rol !== 'encargado') {
      return error(res, 'No autorizado', 403);
    }

    query += ' ORDER BY o.created_at DESC';
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const obtener = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*,
        u.nombre AS responsable_nombre, u.apellido AS responsable_apellido,
        ue.nombre AS encargado_nombre, ue.apellido AS encargado_apellido
      FROM obras o
      LEFT JOIN usuarios u ON u.id = o.responsable_sst_id
      LEFT JOIN usuarios ue ON ue.id = o.encargado_id
      WHERE o.id = ? AND o.empresa_id = ?
    `, [req.params.id, req.usuario.empresa_id]);
    if (!rows.length) return error(res, 'Obra no encontrada', 404);
    const obra = rows[0];
    if (req.usuario.rol === 'inspector_sst' && Number(obra.responsable_sst_id) !== Number(req.usuario.id)) {
      return error(res, 'Obra no encontrada', 404);
    }
    if (req.usuario.rol === 'encargado' && Number(obra.encargado_id) !== Number(req.usuario.id)) {
      return error(res, 'Obra no encontrada', 404);
    }
    return success(res, obra);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, encargado_id, id_dispositivo } = req.body;
  if (!codigo || !nombre) return error(res, 'codigo y nombre son requeridos');
  if (!validarDatosObra({ codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin }, res)) return;
  try {
    const ciudadSanitized = sanitizeOptional(ciudad);
    const direccionSanitized = sanitizeOptional(direccion);
    const fechaInicioSanitized = sanitizeOptional(fecha_inicio);
    const fechaFinSanitized = sanitizeOptional(fecha_fin);
    const responsableSstIdSanitized = sanitizeOptional(responsable_sst_id);
    const encargadoIdSanitized = sanitizeOptional(encargado_id);
    const idDispositivoSanitized = sanitizeOptional(id_dispositivo);

    const [result] = await db.query(
      `INSERT INTO obras (empresa_id, codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, encargado_id, id_dispositivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        codigo,
        nombre,
        ciudadSanitized,
        direccionSanitized,
        fechaInicioSanitized,
        fechaFinSanitized,
        responsableSstIdSanitized,
        encargadoIdSanitized,
        idDispositivoSanitized
      ]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin, responsable_sst_id, encargado_id, id_dispositivo } = req.body;
  if (!validarDatosObra({ codigo, nombre, ciudad, direccion, fecha_inicio, fecha_fin }, res)) return;
  try {
    const ciudadSanitized = sanitizeOptional(ciudad);
    const direccionSanitized = sanitizeOptional(direccion);
    const fechaInicioSanitized = sanitizeOptional(fecha_inicio);
    const fechaFinSanitized = sanitizeOptional(fecha_fin);
    const responsableSstIdSanitized = sanitizeOptional(responsable_sst_id);
    const encargadoIdSanitized = sanitizeOptional(encargado_id);
    const idDispositivoSanitized = sanitizeOptional(id_dispositivo);

    const [result] = await db.query(
      `UPDATE obras SET codigo=?, nombre=?, ciudad=?, direccion=?, fecha_inicio=?, fecha_fin=?, responsable_sst_id=?, encargado_id=?, id_dispositivo=?
       WHERE id=? AND empresa_id=?`,
      [
        codigo,
        nombre,
        ciudadSanitized,
        direccionSanitized,
        fechaInicioSanitized,
        fechaFinSanitized,
        responsableSstIdSanitized,
        encargadoIdSanitized,
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

const stats = async (req, res) => {
  try {
    const [[{ trabajadoresActivos }]] = await db.query(
      "SELECT COUNT(*) AS trabajadoresActivos FROM trabajadores WHERE empresa_id = ? AND estado = 'activo'",
      [req.usuario.empresa_id]
    );
    const [[{ asistenciaHoy }]] = await db.query(
      "SELECT COUNT(*) AS asistenciaHoy FROM registros_asistencia WHERE obra_id IN (SELECT id FROM obras WHERE empresa_id = ?) AND DATE(timestamp) = CURDATE()",
      [req.usuario.empresa_id]
    );
    const [[{ pendientes }]] = await db.query(
      "SELECT COUNT(*) AS pendientes FROM novedades WHERE empresa_id = ? AND estado = 'pendiente'",
      [req.usuario.empresa_id]
    );
    return success(res, { trabajadoresActivos, asistenciaHoy, pendientes });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const pendientes = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT n.id, n.tipo, n.descripcion, n.fecha, t.nombre AS trabajador_nombre, t.apellido AS trabajador_apellido, o.nombre AS obra_nombre FROM novedades n LEFT JOIN trabajadores t ON t.id = n.trabajador_id LEFT JOIN obras o ON o.id = n.obra_id WHERE n.empresa_id = ? AND n.estado = 'pendiente' ORDER BY n.fecha DESC LIMIT 5",
      [req.usuario.empresa_id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, stats, pendientes };