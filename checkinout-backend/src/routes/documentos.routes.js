const router = require('express').Router();
const { listar, crear, actualizar } = require('../controllers/documentos.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.post('/', crear);
router.put('/:id', actualizar);

module.exports = router;
