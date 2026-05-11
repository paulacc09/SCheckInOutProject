const router = require('express').Router();
const {
  abrirJornada,
  cerrarJornada,
  registrarAsistencia,
  listarJornadas,
  listarRegistros,
  resumenAsistencia,
  listarResumenPorTrabajador,
} = require('../controllers/asistencia.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.post('/jornada/abrir', abrirJornada);
router.patch('/jornada/:id/cerrar', cerrarJornada);
router.post('/registrar', registrarAsistencia);
router.get('/jornadas', listarJornadas);
router.get('/resumen', resumenAsistencia);
router.get('/registros', listarRegistros);
router.get('/resumen-trabajadores', listarResumenPorTrabajador);

module.exports = router;