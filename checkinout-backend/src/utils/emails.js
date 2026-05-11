const { sendMail } = require('./mailer');

const enviarCorreoNovedadRegistrada = async ({
  emailAdmin,
  nombreAdmin,
  nombreInspector,
  tipoNovedad,
  nombreTrabajador,
}) => {
  try {
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Nueva novedad registrada</h2>
    <p style="color: #64748b;">Hola, ${nombreAdmin}</p>
    <p style="color: #64748b;">El inspector ${nombreInspector} registró una novedad de tipo ${tipoNovedad} para el trabajador ${nombreTrabajador}.</p>
    <p style="color: #64748b;">Ingresa a CheckInOut para revisarla y aprobarla o rechazarla.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Novedad resuelta</h2>
    <p style="color: #64748b;">Hola, ${nombreInspector}</p>
    <p style="color: #64748b;">Tu novedad de tipo ${tipoNovedad} fue ${estado}.</p>
`;
    if (observacion) {
      html += `<p style="color: #64748b;">Observación: ${observacion}</p>\n`;
    }
    html += `<p style="color: #64748b;">Ingresa a CheckInOut para más detalles.</p>
  </div>
</div>`;
    await sendMail({
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
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Documento próximo a vencer</h2>
    <p style="color: #64748b;">Hola, ${nombreAdmin}</p>
    <p style="color: #64748b;">El documento ${tipoDocumento} del trabajador ${nombreTrabajador} vence en ${diasRestantes} días.</p>
    <p style="color: #64748b;">Ingresa a CheckInOut para renovarlo.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Documento vencido</h2>
    <p style="color: #64748b;">Hola, ${nombreAdmin}</p>
    <p style="color: #64748b;">El documento ${tipoDocumento} del trabajador ${nombreTrabajador} está vencido.</p>
    <p style="color: #64748b;">Ingresa a CheckInOut para tomar acción.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Actualización de jornada</h2>
    <p style="color: #64748b;">Hola, ${nombreAdmin}</p>
    <p style="color: #64748b;">El inspector ${nombreInspector} ${verbo} la jornada en la obra ${nombreObra}.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Cambio de contraseña</h2>
    <p style="color: #64748b;">Hola, ${nombre}</p>
    <p style="color: #64748b;">Tu contraseña fue cambiada exitosamente.</p>
    <p style="color: #64748b;">Si no fuiste tú, contacta al administrador inmediatamente.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0f1f4d, #2563eb); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CheckInOut</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Control de Asistencia y Personal</p>
  </div>
  <div style="padding: 32px;">
    <h2 style="color: #1e293b; margin-top: 0;">Bienvenida a CheckInOut</h2>
    <p style="color: #64748b;">Hola, ${nombre} ${apellido}</p>
    <p style="color: #64748b;">Tu cuenta en CheckInOut ha sido creada. Tu contraseña temporal es: <strong>${passwordTemporal}</strong></p>
    <p style="color: #64748b;">Ingresa a la plataforma y cámbiala desde tu perfil.</p>
  </div>
</div>
`.trim();
    await sendMail({
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
