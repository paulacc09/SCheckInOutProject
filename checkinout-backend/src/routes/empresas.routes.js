const express = require('express');
const router = express.Router();
const { registrar } = require('../controllers/empresas.controller');

router.post('/', registrar);

module.exports = router;
