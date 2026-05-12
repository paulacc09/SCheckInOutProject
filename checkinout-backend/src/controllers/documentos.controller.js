const db = require('../config/db');
const { success, error } = require('../utils/response');
const { crearNotificacion } = require('../utils/notificaciones');
const { enviarCorreoDocumentoProximoVencer, enviarCorreoDocumentoVencido } = require('../utils/emails');

const TIPOS_DOCUMENTO = ['curso_alturas', 'examen_medico'];

const calcularEstadoDoc = (fecha_vencimiento) => {
  const hoy = new Date();
  const venc = new Date(fecha_vencimiento);
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  const estadoDoc = diff < 0 ? 'vencido' : diff <= 30 ? 'por_vencer' : 'vigente';
  return { estadoDoc, diff };
};

const notificarAdminsDocumento = async (req, estadoDoc, tipo, trabajador_id, diff, referencia_id) => {
  if (estadoDoc === 'vigente') return;

  try {
    const [admins] = await db.query(
      `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
      [req.usuario.empresa_id]
    );

    for (const admin of admins) {
      const payload =
        estadoDoc === 'por_vencer'
          ? {
              tipo: 'documento_por_vencer',
              titulo: 'Documento próximo a vencer',
              mensaje: `El documento ${tipo} del trabajador ${trabajador_id} vence en ${diff} días`,
            }
          : {
              tipo: 'documento_vencido',
              titulo: 'Documento vencido',
              mensaje: `El documento ${tipo} del trabajador ${trabajador_id} está vencido`,
            };

      await crearNotificacion({
        empresa_id: req.usuario.empresa_id,
        usuario_destino_id: admin.id,
        usuario_origen_id: req.usuario.id,
        tipo: payload.tipo,
        titulo: payload.titulo,
        mensaje: payload.mensaje,
        referencia_tabla: 'documentos_trabajador',
        referencia_id,
      });

      try {
        const [adminRows] = await db.query(
          `SELECT email, nombre FROM usuarios WHERE id = ?`,
          [admin.id]
        );
        const [trabRows] = await db.query(
          `SELECT CONCAT(nombre,' ',apellido) AS nombre_completo FROM trabajadores WHERE id = ?`,
          [trabajador_id]
        );
        const adminRow = adminRows[0];
        const nombreTrabajador = trabRows[0]?.nombre_completo;
        if (adminRow?.email && nombreTrabajador) {
          if (estadoDoc === 'por_vencer') {
            await enviarCorreoDocumentoProximoVencer({
              emailAdmin: adminRow.email,
              nombreAdmin: adminRow.nombre,
              tipoDocumento: tipo,
              nombreTrabajador,
              diasRestantes: diff,
            });
          } else if (estadoDoc === 'vencido') {
            await enviarCorreoDocumentoVencido({
              emailAdmin: adminRow.email,
              nombreAdmin: adminRow.nombre,
              tipoDocumento: tipo,
              nombreTrabajador,
            });
          }
        }
      } catch (mailErr) {
        console.error(mailErr);
      }
    }
  } catch (notifErr) {
    console.error(notifErr);
  }
};

const listar = async (req, res) => {
  try {
    let query = `
  SELECT d.*,
    CONCAT(t.nombre,' ',t.apellido) AS trabajador_nombre,
    t.cedula AS trabajador_cedula
  FROM documentos_trabajador d
  JOIN trabajadores t ON t.id = d.trabajador_id
  WHERE d.empresa_id = ?
`;
    const params = [req.usuario.empresa_id];
    if (req.query.estado) {
      query += ' AND d.estado = ?';
      params.push(req.query.estado);
    }
    query += ' ORDER BY d.fecha_vencimiento ASC';
    const [rows] = await db.query(query, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const crear = async (req, res) => {
  const { trabajador_id, tipo, fecha_expedicion, fecha_vencimiento, archivo_url } = req.body;
  if (
    trabajador_id === undefined ||
    trabajador_id === null ||
    !tipo ||
    !fecha_expedicion ||
    !fecha_vencimiento
  ) {
    return error(res, 'trabajador_id, tipo, fecha de expedición y fecha de vencimiento son requeridos', 400);
  }
  if (!TIPOS_DOCUMENTO.includes(tipo)) {
    return error(res, 'Tipo de documento inválido', 400);
  }
  const exp = new Date(fecha_expedicion);
  const venc = new Date(fecha_vencimiento);
  if (venc <= exp) {
    return error(res, 'La fecha de vencimiento debe ser posterior a la fecha de expedición', 400);
  }

  const { estadoDoc, diff } = calcularEstadoDoc(fecha_vencimiento);

  try {
    const [result] = await db.query(
      `INSERT INTO documentos_trabajador (trabajador_id, empresa_id, tipo, fecha_expedicion, fecha_vencimiento, estado, archivo_url, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trabajador_id,
        req.usuario.empresa_id,
        tipo,
        fecha_expedicion,
        fecha_vencimiento,
        estadoDoc,
        archivo_url || null,
        req.usuario.id,
      ]
    );

    await notificarAdminsDocumento(req, estadoDoc, tipo, trabajador_id, diff, result.insertId);

    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const actualizar = async (req, res) => {
  const { tipo, fecha_expedicion, fecha_vencimiento } = req.body;
  const actualizarArchivoUrl = Object.prototype.hasOwnProperty.call(req.body, 'archivo_url');
  const archivo_url = req.body.archivo_url;
  if (!tipo || !fecha_expedicion || !fecha_vencimiento) {
    return error(res, 'tipo, fecha de expedición y fecha de vencimiento son requeridos', 400);
  }
  if (!TIPOS_DOCUMENTO.includes(tipo)) {
    return error(res, 'Tipo de documento inválido', 400);
  }
  const exp = new Date(fecha_expedicion);
  const venc = new Date(fecha_vencimiento);
  if (venc <= exp) {
    return error(res, 'La fecha de vencimiento debe ser posterior a la fecha de expedición', 400);
  }

  const { estadoDoc, diff } = calcularEstadoDoc(fecha_vencimiento);

  try {
    let sql = `UPDATE documentos_trabajador SET tipo=?, fecha_expedicion=?, fecha_vencimiento=?, estado=?`;
    const params = [tipo, fecha_expedicion, fecha_vencimiento, estadoDoc];
    if (actualizarArchivoUrl) {
      sql += ', archivo_url=?';
      params.push(archivo_url || null);
    }
    sql += ' WHERE id=? AND empresa_id=?';
    params.push(req.params.id, req.usuario.empresa_id);

    const [result] = await db.query(sql, params);
    if (!result.affectedRows) {
      return error(res, 'Documento no encontrado', 404);
    }

    const [rows] = await db.query(
      `SELECT trabajador_id FROM documentos_trabajador WHERE id = ? AND empresa_id = ?`,
      [req.params.id, req.usuario.empresa_id]
    );
    const trabajador_id = rows.length ? rows[0].trabajador_id : null;

    await notificarAdminsDocumento(
      req,
      estadoDoc,
      tipo,
      trabajador_id,
      diff,
      parseInt(req.params.id, 10)
    );

    return success(res, { mensaje: 'Documento actualizado' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { listar, crear, actualizar };
