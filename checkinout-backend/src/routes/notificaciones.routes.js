const router = require('express').Router();
const { listar, badge, marcarLeida } = require('../controllers/notificaciones.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.get('/badge', badge);
router.patch('/:id/leer', marcarLeida);

module.exports = router;
