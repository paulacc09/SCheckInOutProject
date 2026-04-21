const router = require('express').Router();
const { listar, obtener, crear, actualizar, cambiarEstado } = require('../controllers/obras.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.patch('/:id/estado', cambiarEstado);

module.exports = router;