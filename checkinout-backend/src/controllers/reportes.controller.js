const db = require('../config/db');
const { success, error } = require('../utils/response');
const { crearNotificacion } = require('../utils/notificaciones');
const { obtenerNombreCompleto } = require('../utils/usuario');

const obtenerRowsAsistenciaDiaria = async ({ fecha_inicio, fecha_fin, obra_id, empresa_id }) => {
  let query = `
    SELECT
      t.id AS trabajador_id,
      CONCAT(t.nombre, ' ', t.apellido) AS trabajador,
      t.cedula,
      DATE(r.timestamp) AS fecha,
      MIN(CASE WHEN r.tipo = 'ingreso' THEN r.timestamp END) AS hora_entrada,
      MAX(CASE WHEN r.tipo = 'salida' THEN r.timestamp END) AS hora_salida,
      o.nombre AS obra
    FROM registros_asistencia r
    JOIN trabajadores t ON t.id = r.trabajador_id
    JOIN obras o ON o.id = r.obra_id
    WHERE t.empresa_id = ?
      AND DATE(r.timestamp) BETWEEN ? AND ?
      AND r.estado = 'valido'
  `;
  const params = [empresa_id, fecha_inicio, fecha_fin];
  if (obra_id) {
    query += ' AND r.obra_id = ?';
    params.push(obra_id);
  }
  query += ' GROUP BY t.id, DATE(r.timestamp), o.id ORDER BY DATE(r.timestamp), trabajador';
  const [rows] = await db.query(query, params);
  return rows;
};

const obtenerRowsAusencias = async ({ fecha, obra_id, empresa_id }) => {
  let query = `
      SELECT t.id, CONCAT(t.nombre,' ',t.apellido) AS trabajador, t.cedula
      FROM trabajadores t
      ${obra_id ? "JOIN asignaciones a ON a.trabajador_id = t.id AND a.estado = 'activo' AND a.obra_id = ?" : ''}
      WHERE t.empresa_id = ? AND t.estado = 'activo'
      AND t.id NOT IN (
        SELECT trabajador_id FROM registros_asistencia
        WHERE DATE(timestamp) = ? AND tipo = 'ingreso' AND estado = 'valido'
        ${obra_id ? 'AND obra_id = ?' : ''}
      )
    `;
  const params = obra_id ? [obra_id, empresa_id, fecha, obra_id] : [empresa_id, fecha];
  const [rows] = await db.query(query, params);
  return rows;
};

const obtenerRowsAusenciasRango = async ({ fecha_inicio, fecha_fin, obra_id, empresa_id }) => {
  const fechaDesde = fecha_inicio || new Date().toISOString().split('T')[0];
  const fechaHasta = fecha_fin || fechaDesde;
  let query = `
      WITH RECURSIVE fechas_rango (fecha) AS (
        SELECT CAST(? AS DATE) AS fecha
        UNION ALL
        SELECT fecha + INTERVAL 1 DAY
        FROM fechas_rango
        WHERE fecha < CAST(? AS DATE)
      )
      SELECT
        t.id,
        CONCAT(t.nombre,' ',t.apellido) AS trabajador,
        t.cedula,
        COUNT(DISTINCT fr.fecha) AS total_ausencias
      FROM trabajadores t
      ${obra_id ? "JOIN asignaciones a ON a.trabajador_id = t.id AND a.estado = 'activo' AND a.obra_id = ?" : ''}
      CROSS JOIN fechas_rango fr
      WHERE t.empresa_id = ? AND t.estado = 'activo'
      AND NOT EXISTS (
        SELECT 1 FROM registros_asistencia r
        WHERE r.trabajador_id = t.id
          AND DATE(r.timestamp) = fr.fecha
          AND r.tipo = 'ingreso'
          AND r.estado = 'valido'
          ${obra_id ? 'AND r.obra_id = ?' : ''}
      )
      GROUP BY t.id, t.nombre, t.apellido, t.cedula
      HAVING total_ausencias > 0
      ORDER BY total_ausencias DESC
    `;
  const params = [fechaDesde, fechaHasta];
  if (obra_id) params.push(obra_id);
  params.push(empresa_id);
  if (obra_id) params.push(obra_id);
  const [rows] = await db.query(query, params);
  return rows;
};

const obtenerRowsHorasTrabajadas = async ({ fecha_inicio, fecha_fin, obra_id, empresa_id }) => {
  let query = `
      SELECT 
        t.id AS trabajador_id,
        CONCAT(t.nombre,' ',t.apellido) AS trabajador,
        t.cedula,
        SUM(TIMESTAMPDIFF(MINUTE,
          (SELECT MIN(r2.timestamp) FROM registros_asistencia r2 WHERE r2.trabajador_id = r.trabajador_id AND DATE(r2.timestamp) = DATE(r.timestamp) AND r2.tipo='ingreso'),
          (SELECT MAX(r3.timestamp) FROM registros_asistencia r3 WHERE r3.trabajador_id = r.trabajador_id AND DATE(r3.timestamp) = DATE(r.timestamp) AND r3.tipo='salida')
        )) / 60 AS total_horas,
        COUNT(DISTINCT DATE(r.timestamp)) AS dias_trabajados
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      WHERE t.empresa_id = ? AND DATE(r.timestamp) BETWEEN ? AND ? AND r.tipo = 'ingreso' AND r.estado = 'valido'
      ${obra_id ? 'AND r.obra_id = ?' : ''}
      GROUP BY t.id
    `;
  const params = [empresa_id, fecha_inicio, fecha_fin];
  if (obra_id) params.push(obra_id);
  const [rows] = await db.query(query, params);
  return rows;
};

const asistenciaDiaria = async (req, res) => {
  const { fecha_inicio, fecha_fin, obra_id } = req.query;
  if (!fecha_inicio || !fecha_fin) return error(res, 'fecha_inicio y fecha_fin son requeridos');
  try {
    const rows = await obtenerRowsAsistenciaDiaria({
      fecha_inicio, fecha_fin, obra_id,
      empresa_id: req.usuario.empresa_id
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const ausencias = async (req, res) => {
  const { fecha, fecha_inicio, fecha_fin, obra_id } = req.query;
  try {
    if (fecha_inicio || fecha_fin) {
      const rows = await obtenerRowsAusenciasRango({
        fecha_inicio,
        fecha_fin,
        obra_id,
        empresa_id: req.usuario.empresa_id,
      });
      return success(res, rows);
    }
    const fechaUsada = fecha || new Date().toISOString().split('T')[0];
    const rows = await obtenerRowsAusencias({
      fecha: fechaUsada,
      obra_id,
      empresa_id: req.usuario.empresa_id,
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const horasTrabajadas = async (req, res) => {
  const { fecha_inicio, fecha_fin, obra_id } = req.query;
  if (!fecha_inicio || !fecha_fin) return error(res, 'fecha_inicio y fecha_fin son requeridos');
  try {
    const rows = await obtenerRowsHorasTrabajadas({
      fecha_inicio,
      fecha_fin,
      obra_id,
      empresa_id: req.usuario.empresa_id,
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const enumerarFechas = (fecha_inicio, fecha_fin) => {
  const fechas = [];
  const start = new Date(`${fecha_inicio}T12:00:00`);
  const end = new Date(`${fecha_fin}T12:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    fechas.push(new Date(d).toISOString().split('T')[0]);
  }
  return fechas;
};

const rangoMesActual = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const mm = String(m).padStart(2, '0');
  const last = new Date(y, m, 0).getDate();
  return {
    fecha_inicio: `${y}-${mm}-01`,
    fecha_fin: `${y}-${mm}-${String(last).padStart(2, '0')}`,
  };
};

const generarResumen = async (req, res) => {
  let { fecha_inicio, fecha_fin, obra_id } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    const r = rangoMesActual();
    fecha_inicio = r.fecha_inicio;
    fecha_fin = r.fecha_fin;
  }

  const empresa_id = req.usuario.empresa_id;
  const obraParam =
    obra_id != null && obra_id !== '' && Number.isFinite(Number(obra_id))
      ? Number(obra_id)
      : null;

  try {
    const fechasRango = enumerarFechas(fecha_inicio, fecha_fin);
    // Días calendario del rango (incluye fines de semana y festivos).
    // Deuda técnica: no hay calendario laboral ni fecha de ingreso/retiro por trabajador.
    const diasEnRango = fechasRango.length;

    let queryDaily = `
      SELECT
        t.id AS trabajador_id,
        CONCAT(t.nombre, ' ', t.apellido) AS nombre,
        o.nombre AS obra_nombre,
        DATE(r.timestamp) AS fecha,
        MIN(CASE WHEN r.tipo = 'ingreso' THEN r.timestamp END) AS hora_entrada,
        MAX(CASE WHEN r.tipo = 'salida' THEN r.timestamp END) AS hora_salida,
        CASE
          WHEN MIN(CASE WHEN r.tipo = 'ingreso' THEN r.timestamp END) IS NOT NULL
           AND MAX(CASE WHEN r.tipo = 'salida' THEN r.timestamp END) IS NOT NULL
          THEN TIMESTAMPDIFF(
            MINUTE,
            MIN(CASE WHEN r.tipo = 'ingreso' THEN r.timestamp END),
            MAX(CASE WHEN r.tipo = 'salida' THEN r.timestamp END)
          ) / 60
          ELSE 0
        END AS horas_dia
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      JOIN obras o ON o.id = r.obra_id
      WHERE t.empresa_id = ?
        AND DATE(r.timestamp) BETWEEN ? AND ?
        AND r.estado = 'valido'
    `;
    const paramsDaily = [empresa_id, fecha_inicio, fecha_fin];
    if (obraParam != null) {
      queryDaily += ' AND r.obra_id = ?';
      paramsDaily.push(obraParam);
    }
    queryDaily +=
      ' GROUP BY t.id, DATE(r.timestamp), o.id, t.nombre, t.apellido, o.nombre ORDER BY t.id, DATE(r.timestamp)';

    const [dailyRows] = await db.query(queryDaily, paramsDaily);

    let countQuery = `
      SELECT COUNT(DISTINCT r.trabajador_id, DATE(r.timestamp)) AS total
      FROM registros_asistencia r
      JOIN trabajadores t ON t.id = r.trabajador_id
      JOIN obras o ON o.id = r.obra_id
      WHERE t.empresa_id = ?
        AND DATE(r.timestamp) BETWEEN ? AND ?
        AND r.estado = 'valido'
    `;
    const countParams = [empresa_id, fecha_inicio, fecha_fin];
    if (obraParam != null) {
      countQuery += ' AND r.obra_id = ?';
      countParams.push(obraParam);
    }
    const [[{ total: totalRegistros }]] = await db.query(countQuery, countParams);

    let activosQuery;
    let activosParams;
    if (obraParam != null) {
      activosQuery = `
       SELECT DISTINCT t.id, CONCAT(t.nombre, ' ', t.apellido) AS nombre
       FROM trabajadores t
       JOIN asignaciones a ON a.trabajador_id = t.id AND a.estado = 'activo' AND a.obra_id = ?
       WHERE t.empresa_id = ? AND t.estado = 'activo'
       ORDER BY t.apellido, t.nombre`;
      activosParams = [obraParam, empresa_id];
    } else {
      // Vista global: todos los trabajadores activos de la empresa (sin filtro por obra).
      activosQuery = `
       SELECT t.id, CONCAT(t.nombre, ' ', t.apellido) AS nombre
       FROM trabajadores t
       WHERE t.empresa_id = ? AND t.estado = 'activo'
       ORDER BY t.apellido, t.nombre`;
      activosParams = [empresa_id];
    }
    const [activos] = await db.query(activosQuery, activosParams);

    const porTrabajador = new Map();
    const asistenciaPorDia = new Map();
    for (const row of dailyRows) {
      const id = row.trabajador_id;
      if (!porTrabajador.has(id)) {
        porTrabajador.set(id, {
          nombre: row.nombre,
          fechasConIngreso: new Set(),
          obras: new Set(),
          horasTotales: 0,
        });
      }
      const agg = porTrabajador.get(id);
      if (row.hora_entrada) {
        const fechaDia = String(row.fecha).slice(0, 10);
        agg.fechasConIngreso.add(fechaDia);
        agg.obras.add(row.obra_nombre);
        if (!asistenciaPorDia.has(fechaDia)) asistenciaPorDia.set(fechaDia, new Set());
        asistenciaPorDia.get(fechaDia).add(id);
      }
      agg.horasTotales += Number(row.horas_dia) || 0;
    }

    const diasAsistenciaGlobal = new Set();
    const trabajadores = activos.map((t) => {
      const agg = porTrabajador.get(t.id);
      const diasAsistidos = agg ? agg.fechasConIngreso.size : 0;
      if (agg) {
        for (const f of agg.fechasConIngreso) diasAsistenciaGlobal.add(`${t.id}|${f}`);
      }
      const ausencias = Math.max(0, diasEnRango - diasAsistidos);
      const horasTotales = agg ? Math.round(agg.horasTotales * 100) / 100 : 0;
      const obra =
        agg && agg.obras.size
          ? [...agg.obras].sort((a, b) => a.localeCompare(b)).join(', ')
          : '';
      return {
        id: t.id,
        nombre: t.nombre,
        obra,
        diasAsistidos,
        ausencias,
        horasTotales,
      };
    });

    const ausenciasTotales = trabajadores.reduce((acc, row) => acc + row.ausencias, 0);
    const sumaAsistenciaDiaria = fechasRango.reduce(
      (acc, fecha) => acc + (asistenciaPorDia.get(fecha)?.size ?? 0),
      0
    );
    const promedioDiario =
      fechasRango.length > 0
        ? Math.round((sumaAsistenciaDiaria / fechasRango.length) * 100) / 100
        : 0;

    const vacio = Number(totalRegistros) === 0;

    return success(res, {
      resumen: {
        totalRegistros: Number(totalRegistros),
        diasConAsistencia: diasAsistenciaGlobal.size,
        ausenciasTotales,
        promedioDiario,
      },
      trabajadores,
      vacio,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const rowsToCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lineas = [headers.join(',')];
  for (const row of rows) {
    const valores = headers.map((h) => {
      const v = row[h];
      return v === null || v === undefined ? '' : String(v);
    });
    lineas.push(valores.join(','));
  }
  return lineas.join('\n');
};

const exportarReporte = async (req, res) => {
  const { tipo, fecha_inicio, fecha_fin, formato, obra_id } = req.body;

  if (!tipo || !fecha_inicio || !fecha_fin || !formato) {
    return error(res, 'tipo, fecha_inicio, fecha_fin y formato son requeridos', 400);
  }

  const formatoUpper = String(formato).toUpperCase();
  if (formatoUpper === 'PDF') {
    return error(res, 'PDF en desarrollo', 501);
  }
  if (formatoUpper !== 'CSV') {
    return error(res, 'formato debe ser CSV o PDF', 400);
  }

  try {
    let rows = [];

    if (tipo === 'asistencia_diaria' || tipo === 'asistencia') {
      rows = await obtenerRowsAsistenciaDiaria({
        fecha_inicio,
        fecha_fin,
        obra_id,
        empresa_id: req.usuario.empresa_id,
      });
    } else if (tipo === 'ausencias') {
      const fechas = enumerarFechas(fecha_inicio, fecha_fin);
      for (const fecha of fechas) {
        const diaRows = await obtenerRowsAusencias({
          fecha,
          obra_id,
          empresa_id: req.usuario.empresa_id,
        });
        for (const r of diaRows) {
          rows.push({ fecha, ...r });
        }
      }
    } else if (tipo === 'horas_trabajadas' || tipo === 'horas') {
      rows = await obtenerRowsHorasTrabajadas({
        fecha_inicio,
        fecha_fin,
        obra_id,
        empresa_id: req.usuario.empresa_id,
      });
    } else {
      return error(res, 'tipo de reporte no válido', 400);
    }

    const [insertResult] = await db.query(
      `INSERT INTO reportes (empresa_id, generado_por, tipo, fecha_inicio, fecha_fin, formato)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.empresa_id,
        req.usuario.id,
        tipo,
        fecha_inicio,
        fecha_fin,
        formatoUpper,
      ]
    );

    try {
      const nombreDescargador = await obtenerNombreCompleto(req.usuario.id);
      const [admins] = await db.query(
        `SELECT id FROM usuarios WHERE rol = 'administrador' AND empresa_id = ?`,
        [req.usuario.empresa_id]
      );
      for (const admin of admins) {
        try {
          await crearNotificacion({
            empresa_id: req.usuario.empresa_id,
            usuario_destino_id: admin.id,
            usuario_origen_id: req.usuario.id,
            tipo: 'reporte_descargado',
            titulo: 'Reporte descargado',
            mensaje: `${nombreDescargador} descargó un reporte de ${tipo} (${formato})`,
            referencia_tabla: 'reportes',
            referencia_id: insertResult.insertId,
          });
        } catch (notifErr) {
          console.error(notifErr);
        }
      }
    } catch (notifBlockErr) {
      console.error(notifBlockErr);
    }

    const csvString = rowsToCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_${tipo}_${fecha_inicio}_${fecha_fin}.csv"`
    );
    return res.send(csvString);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  asistenciaDiaria,
  ausencias,
  horasTrabajadas,
  exportarReporte,
  generarResumen,
};
