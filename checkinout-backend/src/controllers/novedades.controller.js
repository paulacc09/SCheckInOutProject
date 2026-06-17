const db = require('../config/db');
const { success, error } = require('../utils/response');
const { crearNotificacion } = require('../utils/notificaciones');
const { enviarCorreoNovedadRegistrada, enviarCorreoNovedadResuelta } = require('../utils/emails');
const { obtenerNombreCompleto } = require('../utils/usuario');

const TIPOS_NOVEDAD = [
  'accidente_laboral',
  'permiso',
  'incapacidad',
  'ausencia_injustificada',
  'otro',
];

const listar = async (req, res) => {
  try {
    const { obra_id } = req.query;
    let query = `
SELECT n.*, 
  CONCAT(t.nombre,' ',t.apellido) AS trabajador_nombre,
  t.cedula AS trabajador_cedula,
  CONCAT(u.nombre,' ',u.apellido) AS reportado_por_nombre,
  o.nombre AS obra_nombre
FROM novedades n
JOIN trabajadores t ON t.id = n.trabajador_id
JOIN usuarios u ON u.id = n.reportado_por
LEFT JOIN obras o ON o.id = n.obra_id
WHERE n.empresa_id = ?
`;
    const params = [req.usuario.empresa_id];
    if (req.query.estado) {
      query += ' AND n.estado = ?';
      params.push(req.query.estado);
    }
    if (obra_id) {
      query += ' AND n.obra_id = ?';
      params.push(obra_id);
    }
    query += ' ORDER BY n.created_at DESC';
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { trabajador_id, obra_id, tipo, descripcion, fecha, soporte_url } = req.body;
  if (
    trabajador_id === undefined ||
    trabajador_id === null ||
    !tipo ||
    !descripcion ||
    !fecha
  ) {
    return error(res, 'trabajador_id, tipo, descripción y fecha son requeridos', 400);
  }
  if (!TIPOS_NOVEDAD.includes(tipo)) {
    return error(res, 'Tipo de novedad inválido', 400);
  }
  try {
    const [result] = await db.query(
      `INSERT INTO novedades (empresa_id, obra_id, trabajador_id, reportado_por, tipo, descripcion, fecha, soporte_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        obra_id || null,
        trabajador_id,
        req.usuario.id,
        tipo,
        descripcion,
        fecha,
        soporte_url || null,
      ]
    );

    const nombreReportador = await obtenerNombreCompleto(req.usuario.id);

    try {
      const [admins] = await db.query(
        `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
        [req.usuario.empresa_id]
      );

      for (const admin of admins) {
        await crearNotificacion({
          empresa_id: req.usuario.empresa_id,
          usuario_destino_id: admin.id,
          usuario_origen_id: req.usuario.id,
          tipo: 'novedad_registrada',
          titulo: 'Nueva novedad registrada',
          mensaje: `${nombreReportador} registró una novedad de tipo ${tipo} para el trabajador ${trabajador_id}`,
          referencia_id: result.insertId,
          referencia_tabla: 'novedades',
        });
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

    try {
      const [adminsEmail] = await db.query(
        `SELECT id, nombre, email FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
        [req.usuario.empresa_id]
      );
      for (const admin of adminsEmail) {
        await enviarCorreoNovedadRegistrada({
          emailAdmin: admin.email,
          nombreAdmin: admin.nombre,
          nombreInspector: nombreReportador,
          tipoNovedad: tipo,
          nombreTrabajador: trabajador_id,
        });
      }
    } catch (emailErr) {
      console.error(emailErr);
    }

    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error('ERROR NOVEDADES:', err.message, err.code);
    return error(res, err.message, 500);
  }
};

const resolver = async (req, res) => {
  const { estado, observacion_resolucion } = req.body;
  if (!['aprobada', 'rechazada'].includes(estado)) {
    return error(res, 'Estado inválido', 400);
  }
  try {
    const [result] = await db.query(
      `UPDATE novedades SET estado=?, resuelto_por=?, fecha_resolucion=NOW(), observacion_resolucion=? WHERE id=? AND empresa_id=?`,
      [
        estado,
        req.usuario.id,
        observacion_resolucion || null,
        req.params.id,
        req.usuario.empresa_id,
      ]
    );
    if (!result.affectedRows) {
      return error(res, 'Novedad no encontrada', 404);
    }

    try {
      const [filas] = await db.query(
        `SELECT reportado_por, tipo FROM novedades WHERE id = ?`,
        [req.params.id]
      );
      if (filas.length) {
        const { reportado_por, tipo: tipo_novedad } = filas[0];
        const nombreResolutor = await obtenerNombreCompleto(req.usuario.id);
        await crearNotificacion({
          empresa_id: req.usuario.empresa_id,
          usuario_destino_id: reportado_por,
          usuario_origen_id: req.usuario.id,
          tipo: 'novedad_resuelta',
          titulo: estado === 'aprobada' ? 'Novedad aprobada' : 'Novedad rechazada',
          mensaje: `Tu novedad de tipo ${tipo_novedad} fue ${estado} por ${nombreResolutor}`,
          referencia_tabla: 'novedades',
          referencia_id: parseInt(req.params.id, 10),
        });
      }
    } catch (notifErr) {
      console.error(notifErr);
    }

    try {
      const [filasEmail] = await db.query(
        `SELECT u.nombre, u.apellido, u.email, n.tipo AS tipo_novedad FROM usuarios u JOIN novedades n ON n.reportado_por = u.id WHERE n.id = ?`,
        [req.params.id]
      );
      if (filasEmail.length) {
        const fila = filasEmail[0];
        await enviarCorreoNovedadResuelta({
          emailInspector: fila.email,
          nombreInspector: `${fila.nombre} ${fila.apellido}`,
          tipoNovedad: fila.tipo_novedad,
          estado,
          observacion: observacion_resolucion || null,
        });
      }
    } catch (emailErr) {
      console.error(emailErr);
    }

    return success(res, { mensaje: 'Novedad resuelta' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const actualizarEstado = async (req, res) => {
  const { estado, observacion_resolucion } = req.body;
  const estadosValidos = ['abierta', 'en_gestion', 'cerrada'];
  if (!estadosValidos.includes(estado)) return error(res, 'estado inválido');
  try {
    const [result] = await db.query(
      `UPDATE novedades 
       SET estado = ?,
           resuelto_por = ?,
           fecha_resolucion = NOW(),
           observacion_resolucion = ?
       WHERE id = ? AND empresa_id = ?`,
      [estado, req.usuario.id, observacion_resolucion || null, req.params.id, req.usuario.empresa_id]
    );
    if (!result.affectedRows) return error(res, 'Novedad no encontrada', 404);
    return success(res, { mensaje: 'Estado actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, crear, resolver, actualizarEstado };
