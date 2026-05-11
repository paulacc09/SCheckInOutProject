const express = require('express');
const cors = require('cors');
const passport = require('./src/utils/passport');
require('dotenv').config();

const novedadesRoutes = require('./src/routes/novedades.routes');
const documentosRoutes = require('./src/routes/documentos.routes');
const notificacionesRoutes = require('./src/routes/notificaciones.routes');

const app = express();

// ✅ Middlewares PRIMERO
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// ✅ Rutas DESPUÉS
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/empresas', require('./src/routes/empresas.routes'));
app.use('/api/trabajadores', require('./src/routes/trabajadores.routes'));
app.use('/api/obras', require('./src/routes/obras.routes'));
app.use('/api/subcargos', require('./src/routes/subcargos.routes'));
app.use('/api/asistencia', require('./src/routes/asistencia.routes'));
app.use('/api/reportes', require('./src/routes/reportes.routes'));
app.use('/api/usuarios', require('./src/routes/usuarios.routes'));
app.use('/api/novedades', novedadesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ message: 'CheckInOut API funcionando ✅' });
});

module.exports = app;