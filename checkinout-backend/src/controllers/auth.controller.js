const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { success, error } = require('../utils/response');
const { registrarAuditoria } = require('../utils/audit');
const { sendMail } = require('../utils/mailer');
const { crearNotificacion } = require('../utils/notificaciones');
const { enviarCorreoCambioContrasena } = require('../utils/emails');

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

const googleCallback = async (req, res) => {
  const profile = req.user || req.body?.profile || req.profile;

  if (!profile?.emails?.[0]?.value) {
    return error(res, 'Perfil de Google inválido', 400);
  }

  const email = profile.emails[0].value;
  const nombre = profile?.name?.givenName || 'Usuario';
  const apellido = profile?.name?.familyName || profile?.displayName || 'Google';

  try {
    let [rows] = await pool.execute(
      `SELECT u.*, e.nombre AS empresa_nombre
       FROM usuarios u
       LEFT JOIN empresas e ON e.id = u.empresa_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    let usuario = rows[0];

    if (!usuario) {
      return res.redirect(`${process.env.FRONTEND_URL}/registro?error=google_not_found`);
    }

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

const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT id, email FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Correo no registrado" });
    }

    const usuario = rows[0];
    const token = crypto.randomBytes(32).toString('hex');

    await pool.execute(
      `UPDATE usuarios
       SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR)
       WHERE id = ?`,
      [token, usuario.id]
    );

    await sendMail({
      to: usuario.email,
      subject: "Recuperación de contraseña - CheckInOut",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; 
              border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); 
                padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1e293b; margin-top: 0;">Recuperación de contraseña</h2>
      <p style="color: #64748b;">Haz clic en el botón para crear una nueva contraseña. 
         El enlace expira en <strong>1 hora</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL}/nueva-clave?token=${token}"
           style="background: #2563eb; color: white; padding: 14px 32px; 
                  border-radius: 6px; text-decoration: none; font-weight: bold;
                  font-size: 16px;">
          Restablecer contraseña
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">
        Si no solicitaste esto, ignora este correo.<br>
        Este enlace expira en 1 hora.
      </p>
    </div>
  </div>
`
    });

    return res.json({ success: true, message: "Correo enviado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

const resetearPassword = async (req, res) => {
  const { token, nuevaPassword } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW() LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Token inválido o expirado" });
    }

    const hash = await bcrypt.hash(nuevaPassword, 10);

    await pool.execute(
      `UPDATE usuarios
       SET password_hash = ?, reset_token = NULL, reset_token_expira = NULL
       WHERE id = ?`,
      [hash, rows[0].id]
    );

    try {
      const [usuarioRows] = await pool.execute(
        `SELECT id, nombre, apellido, email, empresa_id FROM usuarios WHERE id = ?`,
        [rows[0].id]
      );

      if (usuarioRows.length) {
        const usuario = usuarioRows[0];
        const [admins] = await pool.execute(
          `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
          [usuario.empresa_id]
        );

        for (const admin of admins) {
          await crearNotificacion({
            empresa_id: usuario.empresa_id,
            usuario_destino_id: admin.id,
            usuario_origen_id: usuario.id,
            tipo: 'cambio_contrasena',
            titulo: 'Cambio de contraseña',
            mensaje: `El usuario ${usuario.nombre} ${usuario.apellido} realizó un cambio de contraseña`,
            referencia_id: rows[0].id,
            referencia_tabla: 'usuarios'
          });
        }

        try {
          await enviarCorreoCambioContrasena({
            email: usuario.email,
            nombre: usuario.nombre,
          });
        } catch (emailErr) {
          console.error(emailErr);
        }
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

    return res.json({ success: true, message: "Contraseña actualizada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

module.exports = { login, registro, perfil, googleCallback, solicitarRecuperacion, resetearPassword };