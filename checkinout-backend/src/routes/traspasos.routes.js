const router = require('express').Router();
const { listar, crear, actualizarEstado } = require('../controllers/traspasos.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.post('/', crear);
router.patch('/:id/estado', actualizarEstado);

module.exports = router;
