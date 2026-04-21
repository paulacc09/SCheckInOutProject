const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Middlewares PRIMERO
app.use(cors());
app.use(express.json());

// ✅ Rutas DESPUÉS
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/trabajadores', require('./src/routes/trabajadores.routes'));
app.use('/api/obras', require('./src/routes/obras.routes'));
app.use('/api/asistencia', require('./src/routes/asistencia.routes'));
app.use('/api/reportes', require('./src/routes/reportes.routes'));

app.get('/api/ping', (req, res) => {
  res.json({ message: 'CheckInOut API funcionando ✅' });
});

module.exports = app;