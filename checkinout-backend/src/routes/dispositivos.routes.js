const router = require('express').Router();
const { verificarToken } = require('../utils/middlewares/auth.middleware');
const { getAll, create, update, updateEstado, remove } = require('../controllers/dispositivos.controller');

router.use(verificarToken);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/estado', updateEstado);
router.delete('/:id', remove);

module.exports = router;
