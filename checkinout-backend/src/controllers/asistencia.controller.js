const db = require('../config/db');
const { success, error } = require('../utils/response');
const { crearNotificacion } = require('../utils/notificaciones');
const { enviarCorreoJornada } = require('../utils/emails');

const abrirJornada = async (req, res) => {
  const { obra_id } = req.body;
  if (!obra_id) return error(res, 'obra_id es requerido');
  try {
    const [abierta] = await db.query(
      `SELECT id FROM jornadas_asistencia WHERE obra_id=? AND estado='abierta'`,
      [obra_id]
    );
    if (abierta.length) return error(res, 'Ya existe una jornada abierta para esta obra');

    const [result] = await db.query(
      `INSERT INTO jornadas_asistencia (obra_id, inspector_id, hora_apertura) VALUES (?, ?, ?)`,
      [obra_id, req.usuario.id, new Date()]
    );

    try {
      const [obraRows] = await db.query(
        `SELECT nombre, empresa_id FROM obras WHERE id = ?`,
        [obra_id]
      );

      if (obraRows.length) {
        const { nombre, empresa_id } = obraRows[0];
        const [admins] = await db.query(
          `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
          [empresa_id]
        );

        for (const admin of admins) {
          await crearNotificacion({
            empresa_id,
            usuario_destino_id: admin.id,
            usuario_origen_id: req.usuario.id,
            tipo: 'jornada_abierta',
            titulo: 'Jornada abierta',
            mensaje: `El inspector ${req.usuario.nombre} ${req.usuario.apellido} abrió la jornada en la obra "${nombre}"`,
            referencia_id: result.insertId,
            referencia_tabla: 'jornadas_asistencia'
          });
        }

        try {
          const [adminsEmail] = await db.query(
            `SELECT id, nombre, email FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
            [empresa_id]
          );
          const nombreInspector = `${req.usuario.nombre} ${req.usuario.apellido}`;
          for (const admin of adminsEmail) {
            await enviarCorreoJornada({
              emailAdmin: admin.email,
              nombreAdmin: admin.nombre,
              nombreInspector,
              nombreObra: nombre,
              tipo: 'abierta',
            });
          }
        } catch (emailErr) {
          console.error(emailErr);
        }
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

    return success(res, { jornada_id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const cerrarJornada = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE jornadas_asistencia SET estado='cerrada', hora_cierre=?
       WHERE id=? AND estado='abierta'`,
      [new Date(), req.params.id]
    );
    if (!result.affectedRows) return error(res, 'Jornada no encontrada o ya cerrada', 404);

    try {
      const [jornadaRows] = await db.query(
        `SELECT j.obra_id, j.inspector_id, o.nombre AS obra_nombre, o.empresa_id
         FROM jornadas_asistencia j JOIN obras o ON o.id = j.obra_id WHERE j.id = ?`,
        [req.params.id]
      );

      if (jornadaRows.length) {
        const { obra_nombre, empresa_id } = jornadaRows[0];
        const [admins] = await db.query(
          `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
          [empresa_id]
        );

        for (const admin of admins) {
          await crearNotificacion({
            empresa_id,
            usuario_destino_id: admin.id,
            usuario_origen_id: req.usuario.id,
            tipo: 'jornada_cerrada',
            titulo: 'Jornada cerrada',
            mensaje: `El inspector cerró la jornada en la obra "${obra_nombre}"`,
            referencia_id: parseInt(req.params.id),
            referencia_tabla: 'jornadas_asistencia'
          });
        }

        try {
          const [adminsEmail] = await db.query(
            `SELECT id, nombre, email FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
            [empresa_id]
          );
          const nombreInspector = `${req.usuario.nombre} ${req.usuario.apellido}`;
          for (const admin of adminsEmail) {
            await enviarCorreoJornada({
              emailAdmin: admin.email,
              nombreAdmin: admin.nombre,
              nombreInspector,
              nombreObra: obra_nombre,
              tipo: 'cerrada',
            });
          }
        } catch (emailErr) {
          console.error(emailErr);
        }
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

    return success(res, { mensaje: 'Jornada cerrada' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const registrarAsistencia = async (req, res) => {
  const { cedula, tipo, obra_id, metodo = 'cedula' } = req.body;
  if (!cedula || !tipo || !obra_id) return error(res, 'cedula, tipo y obra_id son requeridos');
  if (!['ingreso', 'salida'].includes(tipo)) return error(res, 'tipo debe ser ingreso o salida');

  try {
    const [trabajador] = await db.query(
      `SELECT id FROM trabajadores WHERE cedula=? AND estado='activo'`,
      [cedula]
    );
    if (!trabajador.length) return error(res, 'Trabajador no encontrado o inactivo', 404);

    const [jornada] = await db.query(
      `SELECT id FROM jornadas_asistencia WHERE obra_id=? AND estado='abierta'`,
      [obra_id]
    );
    if (!jornada.length) return error(res, 'No hay jornada abierta para esta obra', 400);

    const trabajador_id = trabajador[0].id;
    const jornada_id = jornada[0].id;

    const ahora = new Date();
    await db.query(
      `INSERT INTO registros_asistencia 
       (jornada_id, trabajador_id, obra_id, tipo, metodo, registrado_por, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jornada_id, trabajador_id, obra_id, tipo, metodo, req.usuario.id, ahora]
    );

    return success(res, { mensaje: `${tipo} registrado correctamente`, timestamp: ahora });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, `Ya existe un registro de ${tipo} para hoy`);
    return error(res, err.message, 500);
  }
};

const listarJornadas = async (req, res) => {
  const { obra_id } = req.query;
  try {
    let query = `
      SELECT j.*, o.nombre AS obra, u.nombre AS inspector_nombre, u.apellido AS inspector_apellido
      FROM jornadas_asistencia j
      JOIN obras o ON o.id = j.obra_id
      JOIN usuarios u ON u.id = j.inspector_id
      WHERE o.empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (obra_id) { query += ` AND j.obra_id = ?`; params.push(obra_id); }
    query += ` ORDER BY j.hora_apertura DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listarRegistros = async (req, res) => {
  const { obra_id, fecha, trabajador_id, tipo, registro_estado } = req.query;
  try {
    let query = `
      SELECT r.*,
             CONCAT(t.nombre,' ',t.apellido) AS trabajador,
             t.cedula,
             o.nombre AS obra_nombre
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      JOIN obras o ON o.id = r.obra_id
      WHERE o.empresa_id = ?
    `;
    const params = [req.usuario.empresa_id];
    if (obra_id) {
      query += ` AND r.obra_id = ?`;
      params.push(obra_id);
    }
    if (fecha) {
      query += ` AND DATE(r.timestamp) = ?`;
      params.push(fecha);
    }
    if (trabajador_id) {
      query += ` AND r.trabajador_id = ?`;
      params.push(trabajador_id);
    }
    if (tipo && ['ingreso', 'salida'].includes(tipo)) {
      query += ` AND r.tipo = ?`;
      params.push(tipo);
    }
    if (registro_estado) {
      query += ` AND r.estado = ?`;
      params.push(registro_estado);
    }
    query += ` ORDER BY r.timestamp DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Esperados / asistentes alineados a los filtros de fecha y obra:
 * esperados = activos empresa (asignados a esa obra si hay filtro obra)
 * asistentes = trabajadores con al menos un ingreso válido ese día en el mismo alcance
 */
const resumenAsistencia = async (req, res) => {
  const { fecha, obra_id } = req.query;
  if (!fecha) return error(res, 'fecha es requerida', 400);

  try {
    const empresaId = req.usuario.empresa_id;
    const obraParam = obra_id ? String(obra_id).trim() : '';

    let sqlEsperados = `
      SELECT COUNT(DISTINCT t.id) AS n
      FROM trabajadores t
      LEFT JOIN asignaciones a ON a.trabajador_id = t.id AND a.estado = 'activo'
      LEFT JOIN obras ob ON ob.id = a.obra_id
      WHERE t.empresa_id = ? AND t.estado = 'activo'
    `;
    const paramsEsp = [empresaId];
    if (obraParam) {
      sqlEsperados += ` AND ob.id = ?`;
      paramsEsp.push(obraParam);
    }

    const [[{ n: esperados }]] = await db.query(sqlEsperados, paramsEsp);

    let sqlAsistentes = `
      SELECT COUNT(DISTINCT r.trabajador_id) AS n
      FROM registros_asistencia r
      JOIN obras o ON o.id = r.obra_id
      WHERE o.empresa_id = ?
        AND DATE(r.timestamp) = ?
        AND r.tipo = 'ingreso'
        AND r.estado = 'valido'
    `;
    const paramsAsis = [empresaId, fecha];
    if (obraParam) {
      sqlAsistentes += ` AND r.obra_id = ?`;
      paramsAsis.push(obraParam);
    }

    const [[{ n: asistentes }]] = await db.query(sqlAsistentes, paramsAsis);

    const pct = esperados > 0
      ? Math.round((asistentes / esperados) * 1000) / 10
      : 0;

    return success(res, {
      fecha,
      obra_id: obraParam || null,
      esperados: Number(esperados) || 0,
      asistentes: Number(asistentes) || 0,
      porcentaje_asistencia: pct,
      trabajadores_activos: Number(esperados) || 0,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listarResumenPorTrabajador = async (req, res) => {
  const { fecha, obra_id, search } = req.query;
  try {
    let query = `
      SELECT t.id AS trabajador_id,
             CONCAT(t.nombre,' ',t.apellido) AS nombre,
             t.cedula,
             o.nombre AS obra,
             MAX(CASE WHEN r.tipo='ingreso' THEN TIME(r.timestamp) END) AS hora_ingreso,
             MAX(CASE WHEN r.tipo='salida' THEN TIME(r.timestamp) END) AS hora_salida,
             DATE(MAX(r.timestamp)) AS fecha,
             CASE WHEN MAX(CASE WHEN r.tipo='salida' THEN 1 ELSE 0 END)=1 THEN 'Salida' WHEN MAX(CASE WHEN r.tipo='ingreso' THEN 1 ELSE 0 END)=1 THEN 'Activo' ELSE 'Ausente' END AS estado
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id=r.trabajador_id
      JOIN obras o ON o.id=r.obra_id
      WHERE o.empresa_id=?
    `;
    const params = [req.usuario.empresa_id];
    if (fecha) {
      query += ` AND DATE(r.timestamp)=?`;
      params.push(fecha);
    }
    if (obra_id) {
      query += ` AND r.obra_id=?`;
      params.push(obra_id);
    }
    if (search) {
      const like = `%${search}%`;
      query += ` AND (CONCAT(t.nombre,' ',t.apellido) LIKE ? OR t.cedula LIKE ?)`;
      params.push(like, like);
    }
    query += ` GROUP BY t.id, r.obra_id, DATE(r.timestamp) ORDER BY fecha DESC`;
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  abrirJornada,
  cerrarJornada,
  registrarAsistencia,
  listarJornadas,
  listarRegistros,
  resumenAsistencia,
  listarResumenPorTrabajador,
};