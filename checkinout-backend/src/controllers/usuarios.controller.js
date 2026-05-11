const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success, error } = require('../utils/response');

const listar = async (req, res) => {
  try {
    let query = `
      SELECT id, nombre, apellido, email, rol, obra_id
      FROM usuarios
      WHERE empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (req.query.rol) {
      query += ' AND rol = ?';
      params.push(req.query.rol);
    }
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { nombre, apellido, email, password, rol, obra_id } = req.body;
  if (!nombre || !apellido || !email || !password || !rol) {
    return error(res, 'nombre, apellido, email, password y rol son obligatorios', 400);
  }
  try {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (existe.length) {
      return error(res, 'El email ya está registrado', 400);
    }

    const empresaId = req.usuario.empresa_id;
    let obraIdSanitized = obra_id != null && String(obra_id).trim() !== '' ? obra_id : null;
    if (obraIdSanitized != null) {
      const [obras] = await db.query(
        'SELECT id FROM obras WHERE id = ? AND empresa_id = ? LIMIT 1',
        [obraIdSanitized, empresaId]
      );
      if (!obras.length) {
        return error(res, 'Obra no válida para esta empresa', 400);
      }
    }

    const password_hash = await bcrypt.hash(String(password), 10);
    const [result] = await db.query(
      `INSERT INTO usuarios (empresa_id, nombre, apellido, email, password_hash, rol, obra_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [empresaId, nombre, apellido, email, password_hash, rol, obraIdSanitized]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { nombre, apellido, rol, obra_id, password } = req.body;
  const empresaId = req.usuario.empresa_id;
  const id = req.params.id;
  try {
    let obraIdSanitized = obra_id != null && String(obra_id).trim() !== '' ? obra_id : null;
    if (obraIdSanitized != null) {
      const [obras] = await db.query(
        'SELECT id FROM obras WHERE id = ? AND empresa_id = ? LIMIT 1',
        [obraIdSanitized, empresaId]
      );
      if (!obras.length) {
        return error(res, 'Obra no válida para esta empresa', 400);
      }
    }

    const pwd = password != null ? String(password).trim() : '';
    if (pwd) {
      const password_hash = await bcrypt.hash(pwd, 10);
      const [result] = await db.query(
        `UPDATE usuarios
         SET nombre = ?, apellido = ?, rol = ?, obra_id = ?, password_hash = ?
         WHERE id = ? AND empresa_id = ?`,
        [nombre, apellido, rol, obraIdSanitized, password_hash, id, empresaId]
      );
      if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
    } else {
      const [result] = await db.query(
        `UPDATE usuarios
         SET nombre = ?, apellido = ?, rol = ?, obra_id = ?
         WHERE id = ? AND empresa_id = ?`,
        [nombre, apellido, rol, obraIdSanitized, id, empresaId]
      );
      if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
    }
    return success(res, { mensaje: 'Usuario actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const eliminar = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM usuarios WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
    return success(res, { mensaje: 'Usuario eliminado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, crear, actualizar, eliminar };
