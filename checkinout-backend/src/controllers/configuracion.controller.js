const pool = require('../config/db');
const { success, error } = require('../utils/response');

function formatTimeHHMM(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.length >= 5) return s.slice(0, 5);
    return s || null;
  }
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(val);
  return s.length >= 5 ? s.slice(0, 5) : s || null;
}

function rowToConfig(row) {
  return {
    empresa: {
      nombre: row.nombre ?? '',
      nit: row.nit ?? '',
      correo: row.email ?? '',
      telefono: row.telefono ?? '',
    },
    horario: {
      inicio: formatTimeHHMM(row.horario_inicio),
      cierre: formatTimeHHMM(row.horario_cierre),
    },
    notificaciones: {
      ausencias: !!row.notif_ausencias,
      dispositivos: !!row.notif_dispositivos,
      reportes: !!row.notif_reportes,
      novedades: !!row.notif_novedades,
      biometria: !!row.notif_biometria,
    },
  };
}

async function fetchConfigByEmpresaId(empresaId) {
  const [rows] = await pool.execute(
    `SELECT nombre, nit, email, telefono, horario_inicio, horario_cierre,
            notif_ausencias, notif_dispositivos, notif_reportes, notif_novedades, notif_biometria
     FROM empresas WHERE id = ? LIMIT 1`,
    [empresaId]
  );
  if (!rows.length) return null;
  return rowToConfig(rows[0]);
}

const getConfig = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  try {
    const data = await fetchConfigByEmpresaId(empresaId);
    if (!data) return error(res, 'Empresa no encontrada', 404);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const saveConfig = async (req, res) => {
  const empresaId = req.usuario.empresa_id;
  if (empresaId == null) {
    return error(res, 'empresa_id no disponible en el token', 400);
  }

  const { empresa = {}, horario = {}, notificaciones = {} } = req.body;

  const nombre = empresa.nombre != null ? String(empresa.nombre) : '';
  const nit = empresa.nit != null ? String(empresa.nit) : '';
  const correo = empresa.correo != null ? String(empresa.correo) : '';
  const telefono = empresa.telefono != null ? String(empresa.telefono) : '';

  const horarioInicio =
    horario.inicio != null && String(horario.inicio).trim() !== ''
      ? String(horario.inicio).trim()
      : null;
  const horarioCierre =
    horario.cierre != null && String(horario.cierre).trim() !== ''
      ? String(horario.cierre).trim()
      : null;

  const na = notificaciones.ausencias ? 1 : 0;
  const nd = notificaciones.dispositivos ? 1 : 0;
  const nr = notificaciones.reportes ? 1 : 0;
  const nn = notificaciones.novedades ? 1 : 0;
  const nb = notificaciones.biometria ? 1 : 0;

  try {
    const [result] = await pool.execute(
      `UPDATE empresas SET
        nombre = ?,
        nit = ?,
        email = ?,
        telefono = ?,
        horario_inicio = ?,
        horario_cierre = ?,
        notif_ausencias = ?,
        notif_dispositivos = ?,
        notif_reportes = ?,
        notif_novedades = ?,
        notif_biometria = ?
       WHERE id = ?`,
      [
        nombre,
        nit,
        correo,
        telefono,
        horarioInicio,
        horarioCierre,
        na,
        nd,
        nr,
        nn,
        nb,
        empresaId,
      ]
    );

    if (!result.affectedRows) {
      return error(res, 'Empresa no encontrada', 404);
    }

    const data = await fetchConfigByEmpresaId(empresaId);
    if (!data) return error(res, 'Empresa no encontrada', 404);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getConfig, saveConfig };
