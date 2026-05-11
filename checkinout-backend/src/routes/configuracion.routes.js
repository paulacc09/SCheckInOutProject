const router = require('express').Router();
const { verificarToken } = require('../utils/middlewares/auth.middleware');
const { getConfig, saveConfig } = require('../controllers/configuracion.controller');

router.use(verificarToken);

router.get('/', getConfig);
router.put('/', saveConfig);

module.exports = router;
