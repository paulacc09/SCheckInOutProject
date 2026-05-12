const pool = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const search = req.query.search != null ? String(req.query.search).trim() : '';
  const obra = req.query.obra != null ? String(req.query.obra).trim() : '';
  const estado = req.query.estado != null ? String(req.query.estado).trim() : '';

  try {
    let sql = `
      SELECT
        d.id,
        d.nombre,
        d.tipo,
        COALESCE(o.nombre, 'Sin asignar') AS obra,
        d.pin,
        d.estado,
        d.ultimo_acceso AS ultimoAcceso
      FROM dispositivos d
      LEFT JOIN obras o ON d.obra_id = o.id
      WHERE d.empresa_id = ?
    `;
    const params = [empresaId];

    if (search) {
      const like = `%${search}%`;
      sql += ' AND (d.nombre LIKE ? OR CAST(d.id AS CHAR) LIKE ?)';
      params.push(like, like);
    }
    if (obra) {
      sql += ' AND d.obra_id = ?';
      params.push(Number(obra));
    }
    if (estado) {
      sql += ' AND d.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY d.nombre ASC';

    const [rows] = await pool.execute(sql, params);

    const [totalRows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM dispositivos WHERE empresa_id = ?',
      [empresaId]
    );
    const [activosRows] = await pool.execute(
      "SELECT COUNT(*) AS activos FROM dispositivos WHERE empresa_id = ? AND estado = 'Activo'",
      [empresaId]
    );
    const [inactivosRows] = await pool.execute(
      "SELECT COUNT(*) AS inactivos FROM dispositivos WHERE empresa_id = ? AND estado = 'Inactivo'",
      [empresaId]
    );
    const [sinRows] = await pool.execute(
      'SELECT COUNT(*) AS sinAsignar FROM dispositivos WHERE empresa_id = ? AND obra_id IS NULL',
      [empresaId]
    );

    const stats = {
      total: Number(totalRows[0]?.total) || 0,
      activos: Number(activosRows[0]?.activos) || 0,
      inactivos: Number(inactivosRows[0]?.inactivos) || 0,
      sinAsignar: Number(sinRows[0]?.sinAsignar) || 0,
    };

    return success(res, { rows, stats });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const { nombre, tipo, obra, pin, id: idBody } = req.body;

  try {
    let id = idBody != null && String(idBody).trim() !== '' ? String(idBody).trim() : null;
    if (!id) {
      const [countRows] = await pool.execute(
        'SELECT COUNT(*) AS c FROM dispositivos WHERE empresa_id = ?',
        [empresaId]
      );
      const c = Number(countRows[0]?.c) || 0;
      id = `DEV-${String(c + 1).padStart(3, '0')}`;
    }

    const obraStr = obra != null ? String(obra).trim() : '';
    const obra_id = !obraStr || obraStr === 'Sin asignar' ? null : Number(obraStr);

    const pinVal = pin != null && String(pin).trim() !== '' ? String(pin).trim() : null;

    await pool.execute(
      `INSERT INTO dispositivos (id, empresa_id, nombre, tipo, obra_id, pin, estado, ultimo_acceso)
       VALUES (?, ?, ?, ?, ?, ?, 'Activo', NULL)`,
      [id, empresaId, nombre, tipo, obra_id, pinVal]
    );

    const [created] = await pool.execute(
      `
      SELECT
        d.id,
        d.nombre,
        d.tipo,
        COALESCE(o.nombre, 'Sin asignar') AS obra,
        d.pin,
        d.estado,
        d.ultimo_acceso AS ultimoAcceso
      FROM dispositivos d
      LEFT JOIN obras o ON d.obra_id = o.id
      WHERE d.id = ? AND d.empresa_id = ?
      LIMIT 1
    `,
      [id, empresaId]
    );

    return success(res, created[0], 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const update = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const { id } = req.params;
  const { nombre, tipo, obra, pin } = req.body;

  try {
    const obraStr = obra != null ? String(obra).trim() : '';
    const obra_id = !obraStr || obraStr === 'Sin asignar' ? null : Number(obraStr);

    const pinVal = pin != null && String(pin).trim() !== '' ? String(pin).trim() : null;

    const [result] = await pool.execute(
      `UPDATE dispositivos
       SET nombre = ?, tipo = ?, obra_id = ?, pin = ?
       WHERE id = ? AND empresa_id = ?`,
      [nombre, tipo, obra_id, pinVal, id, empresaId]
    );

    if (!result.affectedRows) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    const [updated] = await pool.execute(
      `
      SELECT
        d.id,
        d.nombre,
        d.tipo,
        COALESCE(o.nombre, 'Sin asignar') AS obra,
        d.pin,
        d.estado,
        d.ultimo_acceso AS ultimoAcceso
      FROM dispositivos d
      LEFT JOIN obras o ON d.obra_id = o.id
      WHERE d.id = ? AND d.empresa_id = ?
      LIMIT 1
    `,
      [id, empresaId]
    );

    return success(res, updated[0]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const updateEstado = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const { id } = req.params;
  const { estado } = req.body;

  try {
    const [result] = await pool.execute(
      'UPDATE dispositivos SET estado = ? WHERE id = ? AND empresa_id = ?',
      [estado, id, empresaId]
    );

    if (!result.affectedRows) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const remove = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'DELETE FROM dispositivos WHERE id = ? AND empresa_id = ?',
      [id, empresaId]
    );

    if (!result.affectedRows) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    return success(res, { mensaje: 'Dispositivo eliminado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getAll, create, update, updateEstado, remove };
