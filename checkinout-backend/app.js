const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth.routes'));

app.get('/api/ping', (req, res) => {
  res.json({ message: 'CheckInOut API funcionando ✅' });
});

module.exports = app;