const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { subirFoto } = require('../utils/cloudinary');

const getUsuarioId = (req) => req.user?.id ?? req.usuario?.id;

const getPerfil = async (req, res) => {
  const id = getUsuarioId(req);
  if (!id) return error(res, 'No autenticado', 401);

  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, email, cedula, tipo_documento, telefono, rol, foto_url
       FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return error(res, 'Usuario no encontrado', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error(err);
    return error(res, 'Error interno del servidor', 500);
  }
};

const updatePerfil = async (req, res) => {
  const id = getUsuarioId(req);
  if (!id) return error(res, 'No autenticado', 401);

  const { nombre, apellido, telefono } = req.body;
  const campos = [];
  const valores = [];

  if (nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(nombre);
  }
  if (apellido !== undefined) {
    campos.push('apellido = ?');
    valores.push(apellido);
  }
  if (telefono !== undefined) {
    campos.push('telefono = ?');
    valores.push(telefono);
  }

  if (!campos.length) {
    return error(res, 'Envíe al menos uno de: nombre, apellido, telefono');
  }

  try {
    valores.push(id);
    const [result] = await pool.execute(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
    if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
    return success(res, { mensaje: 'Perfil actualizado' });
  } catch (err) {
    console.error(err);
    return error(res, 'Error interno del servidor', 500);
  }
};

const cambiarPassword = async (req, res) => {
  const id = getUsuarioId(req);
  if (!id) return error(res, 'No autenticado', 401);

  const { passwordActual, passwordNueva } = req.body;
  if (passwordActual == null || passwordNueva == null) {
    return error(res, 'passwordActual y passwordNueva son requeridos');
  }
  const actual = String(passwordActual).trim();
  const nueva = String(passwordNueva);
  if (!nueva) return error(res, 'La nueva contraseña no puede estar vacía');

  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) return error(res, 'Usuario no encontrado', 404);

    const ok = await bcrypt.compare(actual, rows[0].password_hash);
    if (!ok) return error(res, 'La contraseña actual no es correcta', 401);

    const password_hash = await bcrypt.hash(nueva, 10);
    await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [
      password_hash,
      id
    ]);
    return success(res, { mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    return error(res, 'Error interno del servidor', 500);
  }
};

const actualizarFoto = async (req, res) => {
  const id = getUsuarioId(req);
  if (!id) return error(res, 'No autenticado', 401);

  if (!req.file || !req.file.buffer) {
    return error(res, 'Archivo de imagen requerido (campo: foto)');
  }

  try {
    const foto_url = await subirFoto(req.file.buffer, 'checkinout/perfiles');
    const [result] = await pool.execute(
      'UPDATE usuarios SET foto_url = ? WHERE id = ?',
      [foto_url, id]
    );
    if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
    return success(res, { foto_url });
  } catch (err) {
    console.error(err);
    return error(res, 'Error al subir o guardar la foto', 500);
  }
};

module.exports = { getPerfil, updatePerfil, cambiarPassword, actualizarFoto };
