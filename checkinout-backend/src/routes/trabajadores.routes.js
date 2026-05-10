const router = require('express').Router();
const { listar, obtener, crear, actualizar, cambiarEstado, buscarPorCedula, guardarDescriptor, identificarPorDescriptor } = require('../controllers/trabajadores.controller');
const { verificarToken } = require('../utils/middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', listar);
router.get('/cedula/:cedula', buscarPorCedula);
router.post('/identificar-rostro', identificarPorDescriptor);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.patch('/:id/estado', cambiarEstado);
router.patch('/:id/descriptor', guardarDescriptor);

module.exports = router;
