const router = require('express').Router();
const { listar } = require('../controllers/usuarios.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);

module.exports = router;
