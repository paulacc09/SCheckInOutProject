const db = require('../config/db');

async function obtenerUsuarioNombre(usuarioId) {
  if (!usuarioId) return null;
  const [rows] = await db.query(
    'SELECT nombre, apellido FROM usuarios WHERE id = ?',
    [usuarioId]
  );
  if (!rows.length) return null;
  return {
    nombre: rows[0].nombre ?? '',
    apellido: rows[0].apellido ?? '',
  };
}

async function obtenerNombreCompleto(usuarioId) {
  const usuario = await obtenerUsuarioNombre(usuarioId);
  if (!usuario) return 'Usuario';
  const completo = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim();
  return completo || 'Usuario';
}

module.exports = { obtenerUsuarioNombre, obtenerNombreCompleto };
