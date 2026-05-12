const router = require('express').Router();
const { verificarToken } = require('../utils/middlewares/auth.middleware');
const uploadMemory = require('../utils/multerMemory');
const {
  getPerfil,
  updatePerfil,
  cambiarPassword,
  actualizarFoto
} = require('../controllers/perfil.controller');

router.use(verificarToken);

router.get('/', getPerfil);
router.put('/', updatePerfil);
router.put('/password', cambiarPassword);
router.put('/foto', uploadMemory.single('foto'), actualizarFoto);

module.exports = router;