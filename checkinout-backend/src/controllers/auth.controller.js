const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');
const { registrarAuditoria } = require('../utils/audit');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return error(res, 'Email y contraseña son requeridos');

  try {
    const [rows] = await pool.execute(
      `SELECT u.*, e.nombre AS empresa_nombre 
       FROM usuarios u 
       LEFT JOIN empresas e ON e.id = u.empresa_id
       WHERE u.email = ? AND u.estado = 'activo'`,
      [email]
    );

    if (rows.length === 0)
      return error(res, 'Credenciales incorrectas', 401);

    const usuario = rows[0];

    if (usuario.intentos_fallidos >= 5)
      return error(res, 'Cuenta bloqueada. Contacta al administrador', 403);

    console.log("BODY:", req.body);
      console.log("PASSWORD RECIBIDA:", `"${password}"`);
      console.log("HASH BD:", usuario.password_hash);

      const passwordLimpia = password.trim();

      const passwordValida = await bcrypt.compare(
        passwordLimpia,
        usuario.password_hash
      );

console.log("RESULTADO COMPARE:", passwordValida);
    if (!passwordValida) {
      await pool.execute(
        `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?`,
        [usuario.id]
      );
      return error(res, 'Credenciales incorrectas', 401);
    }

    await pool.execute(
      `UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = NOW() WHERE id = ?`,
      [usuario.id]
    );

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresa_id: usuario.empresa_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await registrarAuditoria({
      usuario_id: usuario.id,
      entidad: 'usuarios',
      accion: 'LOGIN',
      descripcion: `Login exitoso: ${usuario.email}`,
      ip: req.ip
    });

    return success(res, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        empresa_id: usuario.empresa_id,
        empresa_nombre: usuario.empresa_nombre
      }
    });

  } catch (err) {
    console.error(err);
    return error(res, 'Error interno del servidor', 500);
  }
};

const registro = async (req, res) => {
  const { nombre, apellido, email, password, cedula, telefono, rol, empresa_id } = req.body;

  if (!nombre || !apellido || !email || !password || !rol)
    return error(res, 'Faltan campos obligatorios');

  try {
    const [existe] = await pool.execute(
      `SELECT id FROM usuarios WHERE email = ?`, [email]
    );

    if (existe.length > 0)
      return error(res, 'El email ya está registrado');

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO usuarios (empresa_id, nombre, apellido, email, cedula, password_hash, rol, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [empresa_id || null, nombre, apellido, email, cedula || null, hash, rol, telefono || null]
    );

    return success(res, { id: result.insertId, email, rol }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'Error interno del servidor', 500);
  }
};

const perfil = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, email, rol, telefono, empresa_id, ultimo_acceso 
       FROM usuarios WHERE id = ?`,
      [req.usuario.id]
    );
    if (rows.length === 0) return error(res, 'Usuario no encontrado', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'Error interno del servidor', 500);
  }
};

module.exports = { login, registro, perfil };