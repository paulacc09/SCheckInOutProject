const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nitRegex = /^[0-9-]{5,}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registrar = async (req, res) => {
  const { empresa = {}, admin = {} } = req.body;
  const {
    nombre,
    nit,
    telefono: empresaTelefono,
    email: empresaEmail,
    direccion,
    representante_legal
  } = empresa;
  const {
    nombre: adminNombre,
    apellido: adminApellido,
    email: adminEmail,
    password: adminPassword,
    cedula: adminCedula,
    telefono: adminTelefono
  } = admin;

  const nombreEmpresaLimpio = String(nombre || '').trim();
  const nitLimpio = String(nit || '').trim();
  const adminNombreLimpio = String(adminNombre || '').trim();
  const adminApellidoLimpio = String(adminApellido || '').trim();
  const adminEmailLimpio = String(adminEmail || '').trim().toLowerCase();
  const adminPasswordLimpio = String(adminPassword || '');

  if (!nombreEmpresaLimpio || nombreEmpresaLimpio.length < 3) {
    return error(res, 'El nombre de la empresa es requerido y debe tener mínimo 3 caracteres.', 400);
  }
  if (!nitLimpio || !nitRegex.test(nitLimpio)) {
    return error(res, 'El NIT es requerido, debe tener mínimo 5 caracteres y solo contener números y guiones.', 400);
  }
  if (!adminNombreLimpio || adminNombreLimpio.length < 2) {
    return error(res, 'El nombre del administrador es requerido y debe tener mínimo 2 caracteres.', 400);
  }
  if (!adminApellidoLimpio || adminApellidoLimpio.length < 2) {
    return error(res, 'El apellido del administrador es requerido y debe tener mínimo 2 caracteres.', 400);
  }
  if (!adminEmailLimpio || !emailRegex.test(adminEmailLimpio)) {
    return error(res, 'El email del administrador es requerido y debe tener un formato válido.', 400);
  }
  if (!adminPasswordLimpio || !passwordRegex.test(adminPasswordLimpio)) {
    return error(res, 'La contraseña del administrador es requerida, debe tener mínimo 8 caracteres y contener al menos una letra y un número.', 400);
  }

  let conn;
  try {
    const [empresaExiste] = await db.query(
      `SELECT id FROM empresas WHERE nit = ? LIMIT 1`,
      [nitLimpio]
    );
    if (empresaExiste.length) {
      return error(res, 'El NIT de la empresa ya está registrado.', 400);
    }

    const [adminExiste] = await db.query(
      `SELECT id FROM usuarios WHERE email = ? LIMIT 1`,
      [adminEmailLimpio]
    );
    if (adminExiste.length) {
      return error(res, 'El email del administrador ya está registrado.', 400);
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [empresaResult] = await conn.query(
      `INSERT INTO empresas (nombre, nit, telefono, email, direccion, representante_legal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombreEmpresaLimpio,
        nitLimpio,
        empresaTelefono || null,
        empresaEmail || null,
        direccion || null,
        representante_legal || null
      ]
    );

    const passwordHash = await bcrypt.hash(adminPasswordLimpio, 10);

    const [usuarioResult] = await conn.query(
      `INSERT INTO usuarios (empresa_id, nombre, apellido, email, password_hash, cedula, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'administrador')`,
      [
        empresaResult.insertId,
        adminNombreLimpio,
        adminApellidoLimpio,
        adminEmailLimpio,
        passwordHash,
        adminCedula || null,
        adminTelefono || null
      ]
    );

    await conn.commit();

    return success(res, {
      empresa_id: empresaResult.insertId,
      usuario_id: usuarioResult.insertId,
      mensaje: 'Empresa y administrador registrados correctamente.'
    }, 201);
  } catch (err) {
    if (conn) await conn.rollback();
    return error(res, err.message, 500);
  } finally {
    if (conn) conn.release();
  }
};

module.exports = { registrar };
