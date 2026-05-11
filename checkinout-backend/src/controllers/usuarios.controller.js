const db = require('../config/db');
const { success, error } = require('../utils/response');

const listar = async (req, res) => {
  try {
    let query = `
      SELECT id, nombre, apellido, email, rol
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

module.exports = { listar };
