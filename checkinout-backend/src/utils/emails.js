const transporter = require('./mailer');

const enviarCorreoNovedadRegistrada = async ({
  emailAdmin,
  nombreAdmin,
  nombreInspector,
  tipoNovedad,
  nombreTrabajador,
}) => {
  try {
    const html = `
<p>Hola, ${nombreAdmin}</p>
<p>El inspector ${nombreInspector} registró una novedad de tipo ${tipoNovedad} para el trabajador ${nombreTrabajador}.</p>
<p>Ingresa a CheckInOut para revisarla y aprobarla o rechazarla.</p>
`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailAdmin,
      subject: 'Nueva novedad registrada — CheckInOut',
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoNovedadResuelta = async ({
  emailInspector,
  nombreInspector,
  tipoNovedad,
  estado,
  observacion,
}) => {
  try {
    let html = `
<p>Hola, ${nombreInspector}</p>
<p>Tu novedad de tipo ${tipoNovedad} fue ${estado}.</p>
`;
    if (observacion) {
      html += `<p>Observación: ${observacion}</p>\n`;
    }
    html += `<p>Ingresa a CheckInOut para más detalles.</p>`;
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailInspector,
      subject: `Tu novedad fue ${estado} — CheckInOut`,
      html: html.trim(),
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoDocumentoProximoVencer = async ({
  emailAdmin,
  nombreAdmin,
  tipoDocumento,
  nombreTrabajador,
  diasRestantes,
}) => {
  try {
    const html = `
<p>Hola, ${nombreAdmin}</p>
<p>El documento ${tipoDocumento} del trabajador ${nombreTrabajador} vence en ${diasRestantes} días.</p>
<p>Ingresa a CheckInOut para renovarlo.</p>
`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailAdmin,
      subject: 'Documento próximo a vencer — CheckInOut',
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoDocumentoVencido = async ({
  emailAdmin,
  nombreAdmin,
  tipoDocumento,
  nombreTrabajador,
}) => {
  try {
    const html = `
<p>Hola, ${nombreAdmin}</p>
<p>El documento ${tipoDocumento} del trabajador ${nombreTrabajador} está vencido.</p>
<p>Ingresa a CheckInOut para tomar acción.</p>
`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailAdmin,
      subject: 'Documento vencido — CheckInOut',
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoJornada = async ({
  emailAdmin,
  nombreAdmin,
  nombreInspector,
  nombreObra,
  tipo,
}) => {
  try {
    const verbo = tipo === 'abierta' ? 'abrió' : 'cerró';
    const html = `
<p>Hola, ${nombreAdmin}</p>
<p>El inspector ${nombreInspector} ${verbo} la jornada en la obra ${nombreObra}.</p>
`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailAdmin,
      subject: `Jornada ${tipo} — CheckInOut`,
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoCambioContrasena = async ({ email, nombre }) => {
  try {
    const html = `
<p>Hola, ${nombre}</p>
<p>Tu contraseña fue cambiada exitosamente.</p>
<p>Si no fuiste tú, contacta al administrador inmediatamente.</p>
`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Cambio de contraseña — CheckInOut',
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

const enviarCorreoBienvenida = async ({ email, nombre, apellido, passwordTemporal }) => {
  try {
    const html = `<p>Hola, ${nombre} ${apellido}</p><p>Tu cuenta en CheckInOut ha sido creada. Tu contraseña temporal es: <strong>${passwordTemporal}</strong></p><p>Ingresa a la plataforma y cámbiala desde tu perfil.</p>`.trim();
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Bienvenido a CheckInOut — Tu contraseña temporal',
      html,
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  enviarCorreoNovedadRegistrada,
  enviarCorreoNovedadResuelta,
  enviarCorreoDocumentoProximoVencer,
  enviarCorreoDocumentoVencido,
  enviarCorreoJornada,
  enviarCorreoCambioContrasena,
  enviarCorreoBienvenida,
};
