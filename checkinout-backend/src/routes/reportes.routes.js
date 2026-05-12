const router = require('express').Router();
const {
  asistenciaDiaria,
  ausencias,
  horasTrabajadas,
  exportarReporte,
  generarResumen,
} = require('../controllers/reportes.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/resumen', generarResumen);
router.get('/asistencia', asistenciaDiaria);
router.get('/ausencias', ausencias);
router.get('/horas', horasTrabajadas);
router.post('/exportar', exportarReporte);

module.exports = router;