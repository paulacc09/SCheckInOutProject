const router = require('express').Router();
const { listar, crear, resolver } = require('../controllers/novedades.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.post('/', crear);
router.patch('/:id/resolver', resolver);

module.exports = router;
