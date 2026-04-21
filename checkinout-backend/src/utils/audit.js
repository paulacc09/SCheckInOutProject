const pool = require('../config/db');

const registrarAuditoria = async ({ usuario_id, entidad, accion, descripcion, ip }) => {
  try {
    await pool.execute(
      `INSERT INTO log_auditoria (usuario_id, entidad, accion, descripcion, ip) VALUES (?, ?, ?, ?, ?)`,
      [usuario_id || null, entidad, accion, descripcion, ip || null]
    );
  } catch (err) {
    console.error('Error registrando auditoría:', err.message);
  }
};

module.exports = { registrarAuditoria };